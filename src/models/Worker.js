const mongoose = require('mongoose');
const { SRI_LANKA_DISTRICTS } = require('../config/constants');

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: SRI_LANKA_DISTRICTS,
      index: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: true,
      index: true
    },
    longitude: {
      type: Number,
      required: true,
      index: true
    },
    experience: {
      type: Number, // Years of experience
      default: 3
    },
    description: {
      type: String,
      default: 'Experienced professional dedicated to delivering high quality service.'
    },
    skills: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required in LKR'],
      default: 1500, // LKR per hour
      min: [200, 'Minimum hourly rate is LKR 200']
    },
    pricing: {
      basePrice: { type: Number, default: 500 }, // Inspection or minimum fee
      hourlyRate: { type: Number, default: 1500 }
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    nicVerification: {
      nicNumber: { type: String, trim: true },
      nicImage: { type: String, default: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80' },
      submittedAt: { type: Date, default: Date.now }
    },
    availability: {
      type: Boolean,
      default: true,
      index: true
    },
    workingHours: {
      start: { type: String, default: '08:00 AM' },
      end: { type: String, default: '06:00 PM' },
      days: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    },
    certificates: {
      type: [String],
      default: []
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    timestamps: true
  }
);

// Virtual to sync pricing.hourlyRate with hourlyRate
workerSchema.pre('save', function (next) {
  if (this.hourlyRate) {
    if (!this.pricing) this.pricing = {};
    this.pricing.hourlyRate = this.hourlyRate;
  }
  next();
});

module.exports = mongoose.model('Worker', workerSchema);
