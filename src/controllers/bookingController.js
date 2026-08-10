const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/responseHandler');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user._id, req.body);
    return successResponse(res, 201, 'Booking request placed successfully', booking);
  } catch (error) {
    next(error);
  }
};

const getCustomerBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getCustomerBookings(req.user._id, req.query.status);
    return successResponse(res, 200, 'Customer bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

const getWorkerBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getWorkerBookings(req.user._id, req.query.status);
    return successResponse(res, 200, 'Worker bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    return successResponse(res, 200, 'Booking details retrieved', booking);
  } catch (error) {
    next(error);
  }
};

const respondToBooking = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const booking = await bookingService.respondToBooking(req.user._id, req.params.id, action, reason);
    return successResponse(res, 200, `Booking request ${action}ed successfully`, booking);
  } catch (error) {
    next(error);
  }
};

const startService = async (req, res, next) => {
  try {
    const booking = await bookingService.startService(req.user._id, req.params.id);
    return successResponse(res, 200, 'Service started successfully. Timer active.', booking);
  } catch (error) {
    next(error);
  }
};

const completeService = async (req, res, next) => {
  try {
    const { hoursWorked } = req.body;
    const booking = await bookingService.completeService(req.user._id, req.params.id, hoursWorked);
    return successResponse(res, 200, 'Service completed. Final bill generated.', booking);
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(req.user._id, req.params.id, reason);
    return successResponse(res, 200, 'Booking cancelled successfully', booking);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBookingById,
  respondToBooking,
  startService,
  completeService,
  cancelBooking
};
