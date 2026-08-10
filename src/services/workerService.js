const Worker = require('../models/Worker');
const User = require('../models/User');
const Review = require('../models/Review');
const { calculateDistance, getDistrictCoordinates } = require('./locationService');

// Intelligent Sri Lankan service synonyms & aliases dictionary (including common typos)
const CATEGORY_ALIASES = {
  plumbing: ['plumb', 'plumber', 'plumbers', 'pumbler', 'pipe', 'pipes', 'leak', 'leaks', 'tap', 'taps', 'drain', 'drainage', 'toilet', 'bathroom', 'water', 'pump', 'නල', 'ප්ලම්බර්', 'குழாய்'],
  electrical: ['electr', 'electric', 'electrician', 'electricians', 'wire', 'wiring', 'light', 'lights', 'switch', 'breaker', 'fan', 'power', 'විදුලි', 'மின்சாரம்'],
  medical: ['doctor', 'doc', 'physician', 'medical', 'medicine', 'nurse', 'health', 'clinic', 'consultant', 'patient', 'වෛද්‍ය', 'දොස්තර', 'மருத்துவர்'],
  teaching: ['teach', 'teacher', 'teachers', 'tutor', 'tutors', 'tuition', 'class', 'classes', 'maths', 'science', 'english', 'exam', 'ගුරු', 'පාඩම්', 'ஆசிரியர்'],
  caregiving: ['care', 'caregiver', 'caregivers', 'caregiving', 'nurse', 'nursing', 'elderly', 'elder', 'baby', 'babysitter', 'childcare', 'සත්කාරක', 'பராமரிப்பு'],
  carpentry: ['carpenter', 'carpenters', 'carpentry', 'wood', 'wooden', 'furniture', 'door', 'table', 'chair', 'roof', 'වඩු', 'மரவேலை'],
  gardening: ['garden', 'gardener', 'gardeners', 'gardening', 'grass', 'lawn', 'plants', 'tree', 'trees', 'landscape', 'වතු', 'උද්‍යාන', 'தோட்டம்'],
  cleaning: ['clean', 'cleaner', 'cleaners', 'cleaning', 'housekeeping', 'maid', 'dust', 'wash', 'sofa', 'carpet', 'පිරිසිදු', 'சுத்தம்'],
  ac_repair: ['ac', 'a/c', 'air', 'condition', 'conditioner', 'refrigerator', 'fridge', 'cooling', 'hvac', 'ඒසී', 'குளிர்சாதன'],
  painting: ['paint', 'painter', 'painters', 'painting', 'wall', 'walls', 'color', 'colour', 'තීන්ත', 'வர்ணம்'],
  masonry: ['mason', 'masons', 'masonry', 'cement', 'brick', 'wall', 'plaster', 'tile', 'tiling', 'construction', 'මේසන්', 'மேசன்'],
  mechanic: ['mechanic', 'mechanics', 'auto', 'car', 'vehicle', 'bike', 'motor', 'engine', 'brake', 'garage', 'කාර්මික', 'மெக்கானிக்']
};

/**
 * Resolve matching categories from a search query string
 */
const resolveCategoriesFromQuery = (searchTerm) => {
  if (!searchTerm) return [];
  const term = searchTerm.toLowerCase().trim();
  const matched = [];

  for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (cat.includes(term) || term.includes(cat)) {
      matched.push(cat);
      continue;
    }
    for (const alias of aliases) {
      if (alias.includes(term) || term.includes(alias)) {
        matched.push(cat);
        break;
      }
    }
  }

  return matched;
};

/**
 * Get list of workers with smart search, aliases matching, and distance sorting
 */
const getWorkers = async (query = {}) => {
  const {
    category,
    district,
    search,
    availableOnly,
    verifiedOnly,
    minRating,
    maxPrice,
    latitude,
    longitude,
    sortBy = 'distance' // 'distance', 'rating', 'price_low', 'price_high'
  } = query;

  const filter = {};

  if (availableOnly === 'true' || availableOnly === true) {
    filter.availability = true;
  }

  if (verifiedOnly === 'true' || verifiedOnly === true) {
    filter.verified = true;
  }

  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  if (maxPrice) {
    filter.hourlyRate = { $lte: Number(maxPrice) };
  }

  // If explicit category filter from chips
  if (category && category !== 'all') {
    filter.category = category.toLowerCase().trim();
  }

  // Base query with populated user data
  let workers = await Worker.find(filter).populate({
    path: 'userId',
    select: 'name email phone profileImage language isActive',
    match: { isActive: true }
  });

  // Filter out deactivated users
  workers = workers.filter((w) => w.userId !== null);

  // Smart Search matching
  if (search && search.trim().length > 0) {
    const searchLower = search.toLowerCase().trim();
    const matchedCategories = resolveCategoriesFromQuery(searchLower);

    workers = workers.filter((w) => {
      const nameMatch = w.userId?.name?.toLowerCase().includes(searchLower);
      const categoryMatch = w.category?.toLowerCase() === searchLower || matchedCategories.includes(w.category?.toLowerCase());
      const districtMatch = w.district?.toLowerCase().includes(searchLower);
      const descMatch = w.description?.toLowerCase().includes(searchLower);
      const skillsMatch = w.skills?.some((s) => s.toLowerCase().includes(searchLower));

      return nameMatch || categoryMatch || districtMatch || descMatch || skillsMatch;
    });
  }

  // Customer reference coordinates (either device GPS or chosen custom location)
  let refLat = latitude ? parseFloat(latitude) : null;
  let refLon = longitude ? parseFloat(longitude) : null;

  if ((!refLat || !refLon) && district && district !== 'all') {
    const coords = getDistrictCoordinates(district);
    refLat = coords.latitude;
    refLon = coords.longitude;
  }

  // Calculate dynamic distance for each worker
  let mappedWorkers = workers.map((w) => {
    const workerObj = w.toObject();
    if (refLat && refLon && workerObj.latitude && workerObj.longitude) {
      workerObj.distance = calculateDistance(refLat, refLon, workerObj.latitude, workerObj.longitude);
    } else {
      workerObj.distance = null;
    }
    return workerObj;
  });

  // If district filter is specified AND no search query was passed:
  // Prioritize same-district workers, but if 0 found in district, show closest workers from other districts
  if (district && district !== 'all' && (!search || search.trim().length === 0) && (!category || category === 'all')) {
    const districtWorkers = mappedWorkers.filter((w) => w.district?.toLowerCase() === district.toLowerCase());
    if (districtWorkers.length > 0) {
      mappedWorkers = districtWorkers;
    }
  }

  // Sort workers: Available first, then by requested sort order
  mappedWorkers.sort((a, b) => {
    // Available workers always come first
    if (a.availability !== b.availability) {
      return a.availability ? -1 : 1;
    }

    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === 'price_low') {
      return (a.hourlyRate || 0) - (b.hourlyRate || 0);
    } else if (sortBy === 'price_high') {
      return (b.hourlyRate || 0) - (a.hourlyRate || 0);
    } else {
      // Default: distance
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      return (b.rating || 0) - (a.rating || 0);
    }
  });

  return mappedWorkers;
};

/**
 * Get single worker details with reviews
 */
const getWorkerById = async (workerId, customerCoords = {}) => {
  const worker = await Worker.findById(workerId).populate('userId', 'name email phone profileImage language');
  if (!worker) {
    throw new Error('Worker not found.');
  }

  const reviews = await Review.find({ workerId: worker._id })
    .populate('customerId', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(20);

  const workerObj = worker.toObject();
  workerObj.reviewsList = reviews;

  if (customerCoords.latitude && customerCoords.longitude) {
    workerObj.distance = calculateDistance(
      parseFloat(customerCoords.latitude),
      parseFloat(customerCoords.longitude),
      worker.latitude,
      worker.longitude
    );
  }

  return workerObj;
};

/**
 * Update worker profile (hourly rate, working hours, district, skills, etc.)
 */
const updateWorkerProfile = async (userId, updateData) => {
  const worker = await Worker.findOne({ userId });
  if (!worker) {
    throw new Error('Worker profile not found.');
  }

  const {
    category,
    district,
    address,
    latitude,
    longitude,
    experience,
    description,
    skills,
    hourlyRate,
    workingHours,
    certificates,
    nicNumber
  } = updateData;

  if (category) worker.category = category.toLowerCase().trim();
  if (district) {
    worker.district = district;
    if (!latitude || !longitude) {
      const coords = getDistrictCoordinates(district);
      worker.latitude = coords.latitude;
      worker.longitude = coords.longitude;
    }
  }
  if (address) worker.address = address.trim();
  if (latitude) worker.latitude = parseFloat(latitude);
  if (longitude) worker.longitude = parseFloat(longitude);
  if (experience !== undefined) worker.experience = Number(experience);
  if (description) worker.description = description.trim();
  if (skills) worker.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
  if (hourlyRate) {
    worker.hourlyRate = Number(hourlyRate);
    if (!worker.pricing) worker.pricing = {};
    worker.pricing.hourlyRate = Number(hourlyRate);
  }
  if (workingHours) worker.workingHours = workingHours;
  if (certificates) worker.certificates = certificates;

  if (nicNumber) {
    if (!worker.nicVerification) worker.nicVerification = {};
    worker.nicVerification.nicNumber = nicNumber.trim();
    worker.nicVerification.submittedAt = new Date();
    worker.verificationStatus = 'Pending';
  }

  await worker.save();
  return worker.populate('userId', 'name email phone profileImage');
};

/**
 * Toggle worker availability status
 */
const toggleWorkerAvailability = async (userId, availability) => {
  const worker = await Worker.findOne({ userId });
  if (!worker) {
    throw new Error('Worker profile not found.');
  }

  worker.availability = availability !== undefined ? availability : !worker.availability;
  await worker.save();

  return {
    availability: worker.availability,
    message: worker.availability ? 'You are now Online and available for bookings.' : 'You are now Offline.'
  };
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateWorkerProfile,
  toggleWorkerAvailability
};
