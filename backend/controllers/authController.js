const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { cleanText, normalizeEmail } = require('../utils/text');
const { isEmail, isStrongPassword, PASSWORD_RULE_MESSAGE } = require('../utils/validators');
const { authPayload } = require('../utils/token');

const register = async (req, res) => {
  const fullName = cleanText(req.body.fullName);
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!fullName || !email || !password) throw new ApiError(400, 'All required fields must be provided');
  if (fullName.length < 2 || fullName.length > 100) throw new ApiError(400, 'Full name must be between 2 and 100 characters');
  if (!isEmail(email)) throw new ApiError(400, 'Invalid email format');
  if (!isStrongPassword(password)) throw new ApiError(400, PASSWORD_RULE_MESSAGE);
  if (await User.exists({ email })) throw new ApiError(400, 'An account with this email already exists');

  const user = await User.create({
    fullName,
    email,
    password: await User.hashPassword(password),
    role: ROLES.CUSTOMER,
    isActive: true,
    lastLoginAt: new Date(),
  });

  res.status(201).json(authPayload(user, 'Account created successfully'));
};

const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || typeof password !== 'string' || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid email or password');

  if (user.isLocked) {
    const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(423, `Account is locked. Please try again in ${minutes} minutes.`);
  }

  if (!user.isActive) throw new ApiError(403, 'Account is deactivated. Please contact support.');

  if (!(await user.comparePassword(password))) {
    await user.incLoginAttempts();
    throw new ApiError(400, 'Invalid email or password');
  }

  await user.updateOne({
    $set: { loginAttempts: 0, lastLoginAt: new Date() },
    $unset: { lockUntil: 1 },
  });

  res.status(200).json(authPayload(user, 'Login successful'));
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }
  if (!isStrongPassword(newPassword)) throw new ApiError(400, PASSWORD_RULE_MESSAGE);

  const user = await User.findById(req.user.userId).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = await User.hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  res.status(200).json(authPayload(user, 'Password changed successfully'));
};

const updateProfile = async (req, res) => {
  const fullName = cleanText(req.body.fullName);
  if (fullName.length < 2 || fullName.length > 100) {
    throw new ApiError(400, 'Full name must be between 2 and 100 characters');
  }

  const user = await User.findByIdAndUpdate(req.user.userId, { fullName }, { new: true });
  res.status(200).json(authPayload(user, 'Profile updated successfully'));
};

const me = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, user });
};

const logout = (req, res) => res.status(200).json({ message: 'Logout successful' });

module.exports = { register, login, changePassword, updateProfile, me, logout };
