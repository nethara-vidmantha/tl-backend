const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { validateBooking } = require('../validators/inputValidators');
const { ROLES } = require('../config/constants');

// All booking routes require authentication
router.use(protect);

router.post('/', validateBooking, bookingController.createBooking);
router.get('/customer', bookingController.getCustomerBookings);
router.get('/worker', authorize(ROLES.WORKER), bookingController.getWorkerBookings);
router.get('/:id', bookingController.getBookingById);

// State transitions
router.put('/:id/respond', authorize(ROLES.WORKER), bookingController.respondToBooking);
router.put('/:id/start', authorize(ROLES.WORKER), bookingController.startService);
router.put('/:id/complete', authorize(ROLES.WORKER), bookingController.completeService);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
