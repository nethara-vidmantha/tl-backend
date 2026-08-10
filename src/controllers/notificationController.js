const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/responseHandler');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    return successResponse(res, 200, 'Notifications retrieved', notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    return successResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
