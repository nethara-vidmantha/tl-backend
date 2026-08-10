const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return successResponse(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return successResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const result = await authService.googleAuth(req.body);
    return successResponse(res, 200, 'Google authentication successful', result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    return successResponse(res, 200, 'User profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile
};
