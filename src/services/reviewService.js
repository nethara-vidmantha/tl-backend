const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createNotification } = require('./notificationService');

/**
 * Submit a review for a completed booking
 */
const createReview = async (customerId, reviewData) => {
  const { bookingId, workerId, rating, comment } = reviewData;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Business Rule: Customer must own the booking
  if (booking.customerId.toString() !== customerId.toString()) {
    throw new Error('You can only review bookings made by your account.');
  }

  // Business Rule 5: Only completed bookings can be reviewed
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new Error(`Reviews can only be submitted for completed services. Current booking status is '${booking.status}'.`);
  }

  // Check if review already exists for this booking
  const existingReview = await Review.findOne({ bookingId });
  if (existingReview) {
    throw new Error('You have already submitted a review for this booking.');
  }

  const review = await Review.create({
    workerId: booking.workerId,
    customerId,
    bookingId,
    rating: Number(rating),
    comment: (comment || '').trim()
  });

  // Recalculate worker's aggregate rating
  const workerReviews = await Review.find({ workerId: booking.workerId });
  const totalReviews = workerReviews.length;
  const totalScore = workerReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10) / 10 : 5.0;

  const worker = await Worker.findByIdAndUpdate(
    booking.workerId,
    {
      rating: averageRating,
      totalReviews
    },
    { new: true }
  ).populate('userId', 'name');

  // Notify worker about new review
  if (worker && worker.userId) {
    await createNotification({
      userId: worker.userId._id,
      title: 'New Customer Review',
      message: `You received a ${rating}★ review from your client for ${booking.serviceType}: "${comment ? comment.slice(0, 50) : 'Great job'}"`,
      type: NOTIFICATION_TYPES.REVIEW,
      relatedBookingId: booking._id
    });
  }

  return await Review.findById(review._id)
    .populate('customerId', 'name profileImage')
    .populate('workerId');
};

/**
 * Get all reviews for a worker
 */
const getWorkerReviews = async (workerId) => {
  return await Review.find({ workerId })
    .populate('customerId', 'name profileImage')
    .sort({ createdAt: -1 });
};

module.exports = {
  createReview,
  getWorkerReviews
};
