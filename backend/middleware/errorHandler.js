const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { removeRequestUploads } = require('../utils/files');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

const errorHandler = async (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((item) => item.message);
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
    errors = undefined;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists';
    errors = undefined;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : err.message;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProduction) message = 'Internal server error';
  } else {
    await removeRequestUploads(req);
  }

  if (res.headersSent) return next(err);
  res.status(status).json({ message, ...(Array.isArray(errors) && errors.length ? { errors } : {}) });
};

module.exports = { notFound, errorHandler };
