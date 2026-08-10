const { errorResponse } = require('../utils/responseHandler');
const { SRI_LANKA_DISTRICTS } = require('../config/constants');

// Sri Lanka Phone Regex: matches 07XXXXXXXX, +947XXXXXXXX, 947XXXXXXXX
const SL_PHONE_REGEX = /^(?:0|94|\+94)?(7[0-9]{8})$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const validateRegister = (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || name.trim().length === 0) {
    return errorResponse(res, 400, 'Full name is required.');
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, 400, 'A valid email address is required.');
  }

  if (!password || password.length < 6) {
    return errorResponse(res, 400, 'Password must be at least 6 characters long.');
  }

  if (!phone || !SL_PHONE_REGEX.test(phone.replace(/\s+/g, ''))) {
    return errorResponse(res, 400, 'Please enter a valid Sri Lankan phone number (e.g., 0771234567).');
  }

  if (role && !['customer', 'worker', 'admin'].includes(role)) {
    return errorResponse(res, 400, 'Invalid user role selected.');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return errorResponse(res, 400, 'Please provide a valid email address.');
  }

  if (!password) {
    return errorResponse(res, 400, 'Password is required.');
  }

  next();
};

const validateBooking = (req, res, next) => {
  const { workerId, serviceType, bookingDate, bookingTime, location } = req.body;

  if (!workerId) {
    return errorResponse(res, 400, 'Worker selection is required.');
  }

  if (!serviceType) {
    return errorResponse(res, 400, 'Service type is required.');
  }

  if (!bookingDate) {
    return errorResponse(res, 400, 'Booking date is required.');
  }

  if (!bookingTime) {
    return errorResponse(res, 400, 'Booking time is required.');
  }

  if (!location || !location.address || !location.district) {
    return errorResponse(res, 400, 'Service location and district are required.');
  }

  if (location.district && !SRI_LANKA_DISTRICTS.includes(location.district)) {
    return errorResponse(res, 400, `Invalid Sri Lankan district: ${location.district}`);
  }

  next();
};

const validateReview = (req, res, next) => {
  const { workerId, bookingId, rating } = req.body;

  if (!workerId) {
    return errorResponse(res, 400, 'Worker ID is required.');
  }

  if (!bookingId) {
    return errorResponse(res, 400, 'Booking ID is required.');
  }

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse(res, 400, 'Rating must be an integer between 1 and 5 stars.');
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateBooking,
  validateReview,
  SL_PHONE_REGEX
};
