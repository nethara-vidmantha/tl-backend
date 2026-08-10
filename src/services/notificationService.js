const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../config/constants');

/**
 * Creates an in-app notification for a user
 */
const createNotification = async ({ userId, title, message, type = NOTIFICATION_TYPES.BOOKING, relatedBookingId = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedBookingId,
      isRead: false
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Gets notifications for a specific user
 */
const getUserNotifications = async (userId) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50);
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
