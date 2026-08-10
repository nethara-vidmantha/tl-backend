const { DISTRICT_COORDINATES } = require('../config/constants');

/**
 * Calculates Great-Circle Distance between two coordinates in kilometers using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Resolves default coordinate for any Sri Lankan District
 */
const getDistrictCoordinates = (districtName) => {
  if (!districtName) return DISTRICT_COORDINATES['Colombo'];
  return DISTRICT_COORDINATES[districtName] || DISTRICT_COORDINATES['Colombo'];
};

module.exports = {
  calculateDistance,
  getDistrictCoordinates
};
