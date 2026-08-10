const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/responseHandler');

const processPayment = async (req, res, next) => {
  try {
    const result = await paymentService.processPayment(req.user._id, req.body);
    return successResponse(res, 200, 'Payment processed successfully', result);
  } catch (error) {
    next(error);
  }
};

const getPaymentByBookingId = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByBookingId(req.params.bookingId);
    return successResponse(res, 200, 'Payment details retrieved', payment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentByBookingId
};
