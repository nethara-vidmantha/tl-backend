// TaskLanka System Constants

const ROLES = {
  CUSTOMER: 'customer',
  WORKER: 'worker',
  ADMIN: 'admin'
};

const CATEGORIES = [
  { id: 'plumbing', name: 'Plumber', nameSi: 'නල කාර්මික', nameTa: 'குழாய் பதிப்பாளர்', icon: 'wrench' },
  { id: 'electrical', name: 'Electrician', nameSi: 'විදුලි කාර්මික', nameTa: 'மின்சார வல்லுநர்', icon: 'zap' },
  { id: 'medical', name: 'Doctor / Medical', nameSi: 'වෛද්‍ය / සාත්තු', nameTa: 'மருத்துவர்', icon: 'activity' },
  { id: 'teaching', name: 'Tutor / Teacher', nameSi: 'ගුරු / උපකාරක පන්ති', nameTa: 'ஆசிரியர்', icon: 'book-open' },
  { id: 'caregiving', name: 'Caregiver', nameSi: 'රැකවරණ සේවා', nameTa: 'பராமரிப்பாளர்', icon: 'heart' },
  { id: 'carpentry', name: 'Carpenter', nameSi: 'වඩු කාර්මික', nameTa: 'தச்சர்', icon: 'hammer' },
  { id: 'gardening', name: 'Gardener', nameSi: 'උද්‍යාන පාලක', nameTa: 'தோட்டக்காரர்', icon: 'feather' },
  { id: 'cleaning', name: 'House Cleaning', nameSi: 'නිවාස පිරිසිදු කිරීම්', nameTa: 'வீடு சுத்தம்', icon: 'home' },
  { id: 'other', name: 'Other Services', nameSi: 'වෙනත් සේවාවන්', nameTa: 'பிற சேவைகள்', icon: 'grid' }
];

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

// District Center Coordinates (for default mapping and PickMe/Uber style location assignment)
const DISTRICT_COORDINATES = {
  Colombo: { latitude: 6.9271, longitude: 79.8612 },
  Gampaha: { latitude: 7.0840, longitude: 79.9943 },
  Kalutara: { latitude: 6.5854, longitude: 79.9607 },
  Kandy: { latitude: 7.2906, longitude: 80.6337 },
  Matale: { latitude: 7.4675, longitude: 80.6234 },
  'Nuwara Eliya': { latitude: 6.9497, longitude: 80.7891 },
  Galle: { latitude: 6.0535, longitude: 80.2210 },
  Matara: { latitude: 5.9549, longitude: 80.5550 },
  Hambantota: { latitude: 6.1248, longitude: 81.1185 },
  Jaffna: { latitude: 9.6615, longitude: 80.0255 },
  Kilinochchi: { latitude: 9.3803, longitude: 80.3770 },
  Mannar: { latitude: 8.9810, longitude: 79.9044 },
  Vavuniya: { latitude: 8.7514, longitude: 80.4971 },
  Mullaitivu: { latitude: 9.2671, longitude: 80.8142 },
  Batticaloa: { latitude: 7.7310, longitude: 81.6747 },
  Ampara: { latitude: 7.2975, longitude: 81.6747 },
  Trincomalee: { latitude: 8.5874, longitude: 81.2152 },
  Kurunegala: { latitude: 7.4863, longitude: 80.3623 },
  Puttalam: { latitude: 8.0362, longitude: 79.8283 },
  Anuradhapura: { latitude: 8.3114, longitude: 80.4037 },
  Polonnaruwa: { latitude: 7.9403, longitude: 81.0188 },
  Badulla: { latitude: 6.9934, longitude: 81.0550 },
  Monaragala: { latitude: 6.8728, longitude: 81.3507 },
  Ratnapura: { latitude: 6.6828, longitude: 80.3992 },
  Kegalle: { latitude: 7.2513, longitude: 80.3464 }
};

const BOOKING_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};

const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  QR: 'QR'
};

const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

const NOTIFICATION_TYPES = {
  BOOKING: 'Booking',
  PAYMENT: 'Payment',
  REVIEW: 'Review',
  ACCOUNT: 'Account',
  SYSTEM: 'System'
};

module.exports = {
  ROLES,
  CATEGORIES,
  SRI_LANKA_DISTRICTS,
  DISTRICT_COORDINATES,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES
};
