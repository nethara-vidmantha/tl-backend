const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// All admin routes require admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/toggle-status', adminController.toggleUserActiveStatus);
router.put('/workers/:workerId/verify', adminController.verifyWorker);
router.get('/bookings', adminController.getAllBookings);
router.delete('/reviews/:reviewId', adminController.deleteReview);

module.exports = router;
