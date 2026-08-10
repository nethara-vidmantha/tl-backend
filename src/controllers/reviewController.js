const reviewService = require('../services/reviewService');
const { successResponse } = require('../utils/responseHandler');

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return successResponse(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    next(error);
  }
};

const getWorkerReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getWorkerReviews(req.params.workerId);
    return successResponse(res, 200, 'Worker reviews retrieved', reviews);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getWorkerReviews
};
