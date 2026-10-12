const User = require('../models/User');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { cleanText, normalizeEmail, containsMatch } = require('../utils/text');
const { isEmail, isStrongPassword, PASSWORD_RULE_MESSAGE } = require('../utils/validators');
const { recalculateRating } = require('../services/ratingService');

const ASSIGNABLE_ROLES = [ROLES.CUSTOMER, ROLES.MODERATOR];

const summary = (user) => ({
  userId: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

const findManageableUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === ROLES.SUPER_ADMIN) throw new ApiError(400, 'Cannot modify super admin');
  return user;
};

const parseRole = (role) => {
  if (!ASSIGNABLE_ROLES.includes(role)) throw new ApiError(400, 'Role must be customer or moderator');
  return role;
};

const parseFullName = (value) => {
  const fullName = cleanText(value);
  if (fullName.length < 2 || fullName.length > 100) {
    throw new ApiError(400, 'Full name must be between 2 and 100 characters');
  }
  return fullName;
};

const parseEmail = (value) => {
  const email = normalizeEmail(value);
  if (!isEmail(email)) throw new ApiError(400, 'Invalid email format');
  return email;
};

const parsePassword = (value) => {
  if (!isStrongPassword(value)) throw new ApiError(400, PASSWORD_RULE_MESSAGE);
  return value;
};

const assignRole = (user, role, adminId) => {
  if (role === ROLES.MODERATOR && user.role !== ROLES.MODERATOR) {
    user.promotedBy = adminId;
    user.promotedAt = new Date();
  }
  if (role === ROLES.CUSTOMER) {
    user.promotedBy = undefined;
    user.promotedAt = undefined;
  }
  user.role = role;
};

const listUsers = async (req, res) => {
  const { role, search } = req.query;
  const filter = { role: { $ne: ROLES.SUPER_ADMIN } };
  if (ASSIGNABLE_ROLES.includes(role)) filter.role = role;
  if (typeof search === 'string' && search.trim()) {
    const pattern = containsMatch(search);
    filter.$or = [{ fullName: pattern }, { email: pattern }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, users });
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, user });
};

const createUser = async (req, res) => {
  const fullName = parseFullName(req.body.fullName);
  const email = parseEmail(req.body.email);
  const password = parsePassword(req.body.password);
  const role = req.body.role === undefined ? ROLES.CUSTOMER : parseRole(req.body.role);

  if (await User.exists({ email })) throw new ApiError(400, 'An account with this email already exists');

  const user = new User({
    fullName,
    email,
    password: await User.hashPassword(password),
    isActive: true,
  });
  assignRole(user, role, req.user.userId);
  await user.save();

  res.status(201).json({ message: 'User created successfully', user });
};

const updateUser = async (req, res) => {
  const user = await findManageableUser(req.params.userId);
  const { fullName, email, password, role, isActive } = req.body;

  if (fullName !== undefined) user.fullName = parseFullName(fullName);

  if (email !== undefined) {
    const normalized = parseEmail(email);
    if (normalized !== user.email) {
      if (await User.exists({ email: normalized, _id: { $ne: user._id } })) {
        throw new ApiError(400, 'An account with this email already exists');
      }
      user.email = normalized;
    }
  }

  if (password !== undefined && password !== '') {
    user.password = await User.hashPassword(parsePassword(password));
    user.passwordChangedAt = new Date();
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }

  if (role !== undefined) assignRole(user, parseRole(role), req.user.userId);

  if (isActive !== undefined) {
    if (typeof isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false');
    user.isActive = isActive;
  }

  await user.save();
  res.status(200).json({ message: 'User updated successfully', user });
};

const updateUserRole = async (req, res) => {
  const user = await findManageableUser(req.params.userId);
  const role = parseRole(req.body.role);
  if (user.role === role) throw new ApiError(400, `User is already a ${role}`);

  assignRole(user, role, req.user.userId);
  await user.save();

  res.status(200).json({ message: `User role updated to ${role} successfully`, user: summary(user) });
};

const toggleUserStatus = async (req, res) => {
  const user = await findManageableUser(req.params.userId);
  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user: summary(user),
  });
};

const deleteUser = async (req, res) => {
  const user = await findManageableUser(req.params.userId);

  const reviewedProducts = await Review.distinct('product', { user: user._id });
  await Promise.all([
    Review.deleteMany({ user: user._id }),
    Notification.deleteMany({ userId: user._id }),
    User.updateMany({ promotedBy: user._id }, { $unset: { promotedBy: 1 } }),
  ]);
  await Promise.all(reviewedProducts.map(recalculateRating));
  await user.deleteOne();

  res.status(200).json({ message: 'User deleted successfully' });
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
};
