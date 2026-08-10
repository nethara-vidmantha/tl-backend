const mongoose = require('mongoose');
const { BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    bookingDate: {
      type: String,
      required: true // e.g. "2026-08-10"
    },
    bookingTime: {
      type: String,
      required: true // e.g. "10:00 AM"
    },
    // Flexible PickMe / Uber style Service Location (e.g. anywhere in Sri Lanka)
    location: {
      address: { type: String, required: true },
      district: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      landmark: { type: String, default: '' }
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 1500 // LKR per hour
    },
    serviceStartTime: {
      type: Date,
      default: null
    },
    serviceEndTime: {
      type: Date,
      default: null
    },
    hoursWorked: {
      type: Number,
      default: 1.0 // Defaults to 1 hour minimum estimate
    },
    amount: {
      type: Number,
      required: true,
      default: 1500 // Calculated bill in LKR
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CASH
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
