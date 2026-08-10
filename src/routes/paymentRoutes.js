const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', paymentController.processPayment);
router.get('/booking/:bookingId', paymentController.getPaymentByBookingId);

module.exports = router;
