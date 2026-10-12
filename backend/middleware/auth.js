const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');
const { isObjectId } = require('../utils/validators');

const readToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return null;
  return header.split(' ')[1] || '';
};

const resolveUser = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ApiError(401, error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }

  if (!isObjectId(String(decoded.userId))) throw new ApiError(401, 'Invalid token');

  const user = await User.findById(decoded.userId).select('fullName role isActive passwordChangedAt');
  if (!user) throw new ApiError(401, 'Invalid token');
  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new ApiError(401, 'Token expired');
  }

  return { userId: String(user._id), fullName: user.fullName, role: user.role };
};

const authenticate = async (req, res, next) => {
  const token = readToken(req);
  if (token === null) throw new ApiError(401, 'No token provided');
  if (!token) throw new ApiError(401, 'Malformed token');
  req.user = await resolveUser(token);
  next();
};

const optionalAuth = async (req, res, next) => {
  req.user = null;
  const token = readToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = null;
    }
  }
  next();
};

const authorize = (message, ...roles) => [
  authenticate,
  (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new ApiError(403, message);
    next();
  },
];

const isStaff = (user) => !!user && [ROLES.MODERATOR, ROLES.SUPER_ADMIN].includes(user.role);

const superAdminAuth = authorize('Access denied: Super Admin only', ROLES.SUPER_ADMIN);
const adminAuth = authorize('Access denied: Admin privileges required', ROLES.MODERATOR, ROLES.SUPER_ADMIN);

module.exports = {
  authenticate,
  verifyToken: authenticate,
  optionalAuth,
  adminAuth,
  moderatorAuth: adminAuth,
  superAdminAuth,
  isStaff,
};
