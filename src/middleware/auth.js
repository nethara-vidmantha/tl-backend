const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'tasklanka_super_secret_jwt_key_2026';

/**
 * Protect routes: Requires valid JWT
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Access denied. No authentication token provided.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'User account not found or disabled.');
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired authentication token. Please log in again.');
  }
};

/**
 * Authorize specific roles
 * e.g., authorize('worker', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  JWT_SECRET
};
