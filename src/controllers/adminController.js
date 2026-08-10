const adminService = require('../services/adminService');
const { successResponse } = require('../utils/responseHandler');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    return successResponse(res, 200, 'Platform statistics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

const verifyWorker = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const worker = await adminService.verifyWorker(req.params.workerId, status, notes);
    return successResponse(res, 200, `Worker status updated to ${status}`, worker);
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers(req.query.role);
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

const toggleUserActiveStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserActiveStatus(req.params.userId);
    return successResponse(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user);
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await adminService.getAllBookings(req.query.status);
    return successResponse(res, 200, 'All bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const result = await adminService.deleteReview(req.params.reviewId);
    return successResponse(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  verifyWorker,
  getAllUsers,
  toggleUserActiveStatus,
  getAllBookings,
  deleteReview
};
