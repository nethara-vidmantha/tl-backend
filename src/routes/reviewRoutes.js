const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validateReview } = require('../validators/inputValidators');

router.get('/worker/:workerId', reviewController.getWorkerReviews);
router.post('/', protect, validateReview, reviewController.createReview);

module.exports = router;
