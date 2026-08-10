const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const { ROLES, BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createNotification } = require('./notificationService');

/**
 * Get aggregated platform dashboard statistics
 */
const getPlatformStats = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalWorkers,
    verifiedWorkers,
    pendingVerifications,
    totalBookings,
    completedBookings,
    pendingBookings,
    inProgressBookings,
    totalReviews,
    payments
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Worker.countDocuments(),
    Worker.countDocuments({ verified: true }),
    Worker.countDocuments({ verificationStatus: 'Pending' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
    Booking.countDocuments({ status: BOOKING_STATUS.IN_PROGRESS }),
    Review.countDocuments(),
    Payment.find({ status: 'Completed' })
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Category distribution
  const categoryCounts = await Worker.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
      workers: totalWorkers
    },
    workers: {
      total: totalWorkers,
      verified: verifiedWorkers,
      pendingVerification: pendingVerifications
    },
    bookings: {
      total: totalBookings,
      completed: completedBookings,
      pending: pendingBookings,
      inProgress: inProgressBookings
    },
    financials: {
      totalRevenue,
      currency: 'LKR'
    },
    reviews: {
      total: totalReviews
    },
    categoryDistribution: categoryCounts
  };
};

/**
 * Admin verifies or rejects a worker
 */
const verifyWorker = async (workerId, status, notes = '') => {
  const isApproved = status === 'Verified';

  const worker = await Worker.findByIdAndUpdate(
    workerId,
    {
      verified: isApproved,
      verificationStatus: status
    },
    { new: true }
  ).populate('userId', 'name email');

  if (!worker) {
    throw new Error('Worker not found.');
  }

  // Notify the worker
  if (worker.userId) {
    await createNotification({
      userId: worker.userId._id,
      title: isApproved ? 'Profile Verified!' : 'Verification Update',
      message: isApproved
        ? 'Congratulations! Your TaskLanka professional profile has been verified with a blue badge.'
        : `Your verification request was updated to '${status}'. ${notes}`,
      type: NOTIFICATION_TYPES.ACCOUNT
    });
  }

  return worker;
};

/**
 * Admin lists all users with filtering
 */
const getAllUsers = async (role = null) => {
  const query = {};
  if (role && role !== 'all') {
    query.role = role;
  }
  return await User.find(query).sort({ createdAt: -1 });
};

/**
 * Admin disables or enables a user account
 */
const toggleUserActiveStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

/**
 * Admin lists all bookings across platform
 */
const getAllBookings = async (status = null) => {
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }
  return await Booking.find(query)
    .populate('customerId', 'name email phone')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .sort({ createdAt: -1 });
};

/**
 * Admin removes an inappropriate review
 */
const deleteReview = async (reviewId) => {
  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) throw new Error('Review not found.');

  // Recalculate worker's rating
  const workerReviews = await Review.find({ workerId: review.workerId });
  const totalReviews = workerReviews.length;
  const totalScore = workerReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 5.0;

  await Worker.findByIdAndUpdate(review.workerId, {
    rating: averageRating,
    totalReviews
  });

  return { message: 'Review successfully removed and worker rating adjusted.' };
};

module.exports = {
  getPlatformStats,
  verifyWorker,
  getAllUsers,
  toggleUserActiveStatus,
  getAllBookings,
  deleteReview
};
