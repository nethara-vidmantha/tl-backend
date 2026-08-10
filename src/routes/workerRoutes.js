const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public worker discovery
router.get('/', workerController.getWorkers);
router.get('/:id', workerController.getWorkerById);

// Worker authenticated actions
router.put('/profile', protect, authorize(ROLES.WORKER), workerController.updateProfile);
router.put('/availability', protect, authorize(ROLES.WORKER), workerController.toggleAvailability);

module.exports = router;
