const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, fullName: user.fullName, role: user.role, isActive: user.isActive },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const publicUser = (user) => ({
  userId: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const authPayload = (user, message) => ({ message, token: signToken(user), user: publicUser(user) });

module.exports = { signToken, publicUser, authPayload };
