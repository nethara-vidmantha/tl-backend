const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { CATEGORIES, SRI_LANKA_DISTRICTS, DISTRICT_COORDINATES } = require('./config/constants');

// Route imports
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'TaskLanka API Engine',
    version: '1.0.0'
  });
});

// Metadata endpoints
app.get('/api/categories', (req, res) => {
  res.status(200).json({
    success: true,
    data: CATEGORIES
  });
});

app.get('/api/districts', (req, res) => {
  res.status(200).json({
    success: true,
    data: SRI_LANKA_DISTRICTS.map((name) => ({
      name,
      coordinates: DISTRICT_COORDINATES[name] || DISTRICT_COORDINATES['Colombo']
    }))
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on TaskLanka server.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
