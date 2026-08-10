const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { PAYMENT_STATUS, PAYMENT_METHODS, BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createNotification } = require('./notificationService');

/**
 * Generate a simulated Sri Lankan EMVCo standard LankaQR payload string
 */
const generateLankaQRPayload = (bookingId, amount, merchantName = 'TaskLanka Pay') => {
  const timestamp = Date.now();
  return `00020101021226480010LK.CEFT.QR0112${bookingId}520459995303144540${amount}.005802LK5913${merchantName}6007Colombo6304${timestamp.toString().slice(-4)}`;
};

/**
 * Process a payment for a booking
 */
const processPayment = async (customerId, paymentData) => {
  const { bookingId, method, cardDetails = {} } = paymentData;

  const booking = await Booking.findById(bookingId).populate('workerId');
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.customerId.toString() !== customerId.toString()) {
    throw new Error('Unauthorized payment attempt for this booking.');
  }

  if (booking.paymentStatus === PAYMENT_STATUS.COMPLETED) {
    throw new Error('This booking has already been paid for.');
  }

  const transactionReference = `TXN-LKA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let paymentDetails = {
    note: `Payment for ${booking.serviceType} (${booking.hoursWorked} hrs @ LKR ${booking.hourlyRate}/hr)`
  };

  if (method === PAYMENT_METHODS.CARD) {
    paymentDetails.cardBrand = cardDetails.brand || 'Visa / Mastercard';
    paymentDetails.cardLast4 = cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : '4242';
  } else if (method === PAYMENT_METHODS.QR) {
    paymentDetails.qrReference = generateLankaQRPayload(booking._id, booking.amount);
  } else {
    paymentDetails.note = 'Cash on Delivery (to be paid directly to service provider)';
  }

  const payment = await Payment.create({
    bookingId: booking._id,
    customerId,
    workerId: booking.workerId._id,
    amount: booking.amount,
    method,
    status: PAYMENT_STATUS.COMPLETED,
    transactionReference,
    paymentDetails
  });

  // Update Booking status
  booking.paymentStatus = PAYMENT_STATUS.COMPLETED;
  booking.paymentMethod = method;
  await booking.save();

  // Notify worker about payment
  if (booking.workerId && booking.workerId.userId) {
    await createNotification({
      userId: booking.workerId.userId,
      title: 'Payment Received',
      message: `Payment of LKR ${booking.amount} for ${booking.serviceType} received via ${method}.`,
      type: NOTIFICATION_TYPES.PAYMENT,
      relatedBookingId: booking._id
    });
  }

  // Notify customer
  await createNotification({
    userId: customerId,
    title: 'Payment Receipt',
    message: `Your payment of LKR ${booking.amount} (${method}) for ${booking.serviceType} was successful. Ref: ${transactionReference}`,
    type: NOTIFICATION_TYPES.PAYMENT,
    relatedBookingId: booking._id
  });

  return {
    payment,
    booking
  };
};

/**
 * Get payment receipt / details by booking ID
 */
const getPaymentByBookingId = async (bookingId) => {
  const payment = await Payment.findOne({ bookingId })
    .populate('customerId', 'name email phone')
    .populate({
      path: 'workerId',
      populate: { path: 'userId', select: 'name phone' }
    });

  return payment;
};

module.exports = {
  processPayment,
  getPaymentByBookingId,
  generateLankaQRPayload
};
