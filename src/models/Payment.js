const mongoose = require('mongoose');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('../config/constants');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true
    },
    paymentDetails: {
      cardBrand: { type: String, default: '' },
      cardLast4: { type: String, default: '' },
      qrReference: { type: String, default: '' },
      note: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
