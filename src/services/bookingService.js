const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { BOOKING_STATUS, PAYMENT_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createNotification } = require('./notificationService');
const { getDistrictCoordinates } = require('./locationService');

/**
 * Create a new service booking request
 */
const createBooking = async (customerId, bookingData) => {
  const { workerId, serviceType, description, bookingDate, bookingTime, location, estimatedHours = 1 } = bookingData;

  const worker = await Worker.findById(workerId).populate('userId', 'name');
  if (!worker) {
    throw new Error('Selected worker not found.');
  }

  // Business Rule 1: Cannot book an unavailable worker
  if (!worker.availability) {
    throw new Error('This worker is currently offline and unavailable for new bookings.');
  }

  // Validate or fallback service location coordinates
  let locLat = location.latitude;
  let locLon = location.longitude;
  if (!locLat || !locLon) {
    const coords = getDistrictCoordinates(location.district);
    locLat = coords.latitude;
    locLon = coords.longitude;
  }

  const hourlyRate = worker.hourlyRate || 1500;
  const initialHours = Math.max(1, Number(estimatedHours) || 1);
  const estimatedAmount = initialHours * hourlyRate;

  const booking = await Booking.create({
    customerId,
    workerId: worker._id,
    serviceType: serviceType || worker.category,
    description: description.trim(),
    bookingDate,
    bookingTime,
    location: {
      address: location.address,
      district: location.district,
      latitude: locLat,
      longitude: locLon,
      landmark: location.landmark || ''
    },
    hourlyRate,
    hoursWorked: initialHours,
    amount: estimatedAmount,
    status: BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING
  });

  const customer = await User.findById(customerId);

  // Notify worker about the new booking request
  await createNotification({
    userId: worker.userId._id,
    title: 'New Service Request',
    message: `${customer.name} requested ${serviceType} at ${location.district} on ${bookingDate} at ${bookingTime}.`,
    type: NOTIFICATION_TYPES.BOOKING,
    relatedBookingId: booking._id
  });

  return await Booking.findById(booking._id)
    .populate('customerId', 'name email phone profileImage')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name email phone profileImage' }
    });
};

/**
 * Worker responds to booking: Accept or Reject
 */
const respondToBooking = async (workerUserId, bookingId, action, rejectionReason = '') => {
  const worker = await Worker.findOne({ userId: workerUserId });
  if (!worker) {
    throw new Error('Worker profile not found.');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Business Rule 3: Only assigned worker can accept/reject
  if (booking.workerId.toString() !== worker._id.toString()) {
    throw new Error('You are not authorized to respond to this booking.');
  }

  if (booking.status !== BOOKING_STATUS.PENDING) {
    throw new Error(`Cannot ${action} a booking that is currently '${booking.status}'.`);
  }

  if (action === 'accept') {
    booking.status = BOOKING_STATUS.ACCEPTED;
  } else if (action === 'reject') {
    booking.status = BOOKING_STATUS.REJECTED;
    booking.cancellationReason = rejectionReason || 'Worker is unavailable at this time.';
  } else {
    throw new Error('Invalid action. Use "accept" or "reject".');
  }

  await booking.save();

  // Notify customer
  await createNotification({
    userId: booking.customerId,
    title: action === 'accept' ? 'Booking Accepted!' : 'Booking Request Declined',
    message: action === 'accept'
      ? `Your booking for ${booking.serviceType} has been accepted by the service provider.`
      : `Your booking for ${booking.serviceType} was declined: ${booking.cancellationReason}`,
    type: NOTIFICATION_TYPES.BOOKING,
    relatedBookingId: booking._id
  });

  return await getBookingById(booking._id);
};

/**
 * Worker starts the service (Timer starts)
 */
const startService = async (workerUserId, bookingId) => {
  const worker = await Worker.findOne({ userId: workerUserId });
  if (!worker) throw new Error('Worker profile not found.');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found.');

  if (booking.workerId.toString() !== worker._id.toString()) {
    throw new Error('Unauthorized.');
  }

  if (booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw new Error(`Service can only be started when booking status is 'Accepted'. Current status: ${booking.status}`);
  }

  booking.status = BOOKING_STATUS.IN_PROGRESS;
  booking.serviceStartTime = new Date();
  await booking.save();

  // Notify customer
  await createNotification({
    userId: booking.customerId,
    title: 'Service In Progress',
    message: `Worker has started working on your ${booking.serviceType} service. Hourly timer is active.`,
    type: NOTIFICATION_TYPES.BOOKING,
    relatedBookingId: booking._id
  });

  return await getBookingById(booking._id);
};

/**
 * Worker stops and completes the service (Calculates hours & total bill)
 */
const completeService = async (workerUserId, bookingId, manualHoursWorked = null) => {
  const worker = await Worker.findOne({ userId: workerUserId });
  if (!worker) throw new Error('Worker profile not found.');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found.');

  if (booking.workerId.toString() !== worker._id.toString()) {
    throw new Error('Unauthorized.');
  }

  if (booking.status !== BOOKING_STATUS.IN_PROGRESS && booking.status !== BOOKING_STATUS.ACCEPTED) {
    throw new Error(`Cannot complete booking in '${booking.status}' status.`);
  }

  const endTime = new Date();
  booking.serviceEndTime = endTime;

  // Calculate duration in hours
  let hours = 1.0;
  if (manualHoursWorked && Number(manualHoursWorked) > 0) {
    hours = Number(manualHoursWorked);
  } else if (booking.serviceStartTime) {
    const diffMs = endTime - new Date(booking.serviceStartTime);
    const calculatedHours = diffMs / (1000 * 60 * 60);
    // Minimum 1 hour, rounded to 1 decimal place
    hours = Math.max(1.0, Math.round(calculatedHours * 10) / 10);
  }

  const totalAmount = Math.round(hours * booking.hourlyRate);

  booking.hoursWorked = hours;
  booking.amount = totalAmount;
  booking.status = BOOKING_STATUS.COMPLETED;
  await booking.save();

  // Notify customer to pay and review
  await createNotification({
    userId: booking.customerId,
    title: 'Service Completed',
    message: `Service completed! Duration: ${hours} hr(s). Total: LKR ${totalAmount}. Please complete payment and leave a review.`,
    type: NOTIFICATION_TYPES.BOOKING,
    relatedBookingId: booking._id
  });

  return await getBookingById(booking._id);
};

/**
 * Customer cancels booking
 */
const cancelBooking = async (customerId, bookingId, reason = 'Cancelled by customer') => {
  const booking = await Booking.findById(bookingId).populate('workerId');
  if (!booking) throw new Error('Booking not found.');

  if (booking.customerId.toString() !== customerId.toString()) {
    throw new Error('Only the customer who placed this booking can cancel it.');
  }

  if (booking.status === BOOKING_STATUS.COMPLETED || booking.status === BOOKING_STATUS.CANCELLED) {
    throw new Error(`Cannot cancel a booking that is already ${booking.status}.`);
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancellationReason = reason;
  await booking.save();

  // Notify worker
  if (booking.workerId && booking.workerId.userId) {
    await createNotification({
      userId: booking.workerId.userId,
      title: 'Booking Cancelled',
      message: `The booking for ${booking.serviceType} on ${booking.bookingDate} has been cancelled by customer.`,
      type: NOTIFICATION_TYPES.BOOKING,
      relatedBookingId: booking._id
    });
  }

  return await getBookingById(booking._id);
};

/**
 * Get single booking with all populated details
 */
const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('customerId', 'name email phone profileImage')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name email phone profileImage' }
    });

  if (!booking) throw new Error('Booking not found.');
  return booking;
};

/**
 * Get bookings for customer
 */
const getCustomerBookings = async (customerId, statusFilter = null) => {
  const query = { customerId };
  if (statusFilter && statusFilter !== 'all') {
    query.status = statusFilter;
  }

  return await Booking.find(query)
    .populate('customerId', 'name email phone profileImage')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name email phone profileImage' }
    })
    .sort({ createdAt: -1 });
};

/**
 * Get bookings for worker
 */
const getWorkerBookings = async (workerUserId, statusFilter = null) => {
  const worker = await Worker.findOne({ userId: workerUserId });
  if (!worker) throw new Error('Worker profile not found.');

  const query = { workerId: worker._id };
  if (statusFilter && statusFilter !== 'all') {
    query.status = statusFilter;
  }

  return await Booking.find(query)
    .populate('customerId', 'name email phone profileImage')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name email phone profileImage' }
    })
    .sort({ createdAt: -1 });
};

module.exports = {
  createBooking,
  respondToBooking,
  startService,
  completeService,
  cancelBooking,
  getBookingById,
  getCustomerBookings,
  getWorkerBookings
};
