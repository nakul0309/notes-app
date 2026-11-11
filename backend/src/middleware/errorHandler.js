const { ZodError } = require('zod');
const { nodeEnv } = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email is already registered', code: 'DUPLICATE' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body', code: 'BAD_JSON' });
  }

  if (nodeEnv !== 'test') console.error(err);
  return res.status(500).json({ message: 'Internal server error', code: 'SERVER_ERROR' });
};

module.exports = { notFound, errorHandler };
