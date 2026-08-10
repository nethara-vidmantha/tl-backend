const { errorResponse } = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return errorResponse(res, 400, `Validation Error: ${message}`);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, 409, `An account with this ${field} already exists.`);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, `Invalid ID format: ${err.value}`);
  }

  // JSON Web Token error
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token.');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token expired.');
  }

  return errorResponse(res, err.statusCode || 500, err.message || 'Internal Server Error');
};

module.exports = errorHandler;
