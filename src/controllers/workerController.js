const workerService = require('../services/workerService');
const { successResponse } = require('../utils/responseHandler');

const getWorkers = async (req, res, next) => {
  try {
    const workers = await workerService.getWorkers(req.query);
    return successResponse(res, 200, 'Workers retrieved successfully', workers);
  } catch (error) {
    next(error);
  }
};

const getWorkerById = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;
    const worker = await workerService.getWorkerById(req.params.id, { latitude, longitude });
    return successResponse(res, 200, 'Worker details retrieved', worker);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const worker = await workerService.updateWorkerProfile(req.user._id, req.body);
    return successResponse(res, 200, 'Worker profile updated successfully', worker);
  } catch (error) {
    next(error);
  }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const result = await workerService.toggleWorkerAvailability(req.user._id, availability);
    return successResponse(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateProfile,
  toggleAvailability
};
