const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    message: { message },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
  });

const MINUTE = 60 * 1000;

module.exports = {
  generalLimiter: createLimiter({ windowMs: MINUTE, limit: 200, message: 'Too many requests. Please slow down.' }),
  authLimiter: createLimiter({
    windowMs: 15 * MINUTE,
    limit: 10,
    message: 'Too many attempts. Please try again later.',
    skipSuccessfulRequests: true,
  }),
  orderCreateLimiter: createLimiter({
    windowMs: 15 * MINUTE,
    limit: 10,
    message: 'Too many orders created. Please try again later.',
  }),
};
