const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { JWT_SECRET } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getDistrictCoordinates } = require('./locationService');

/**
 * Generate signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Register a new User
 */
const registerUser = async (userData) => {
  const { name, email, password, phone, role = ROLES.CUSTOMER, language = 'en', category, district = 'Colombo', hourlyRate = 1500, address, profileImage } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const districtCoords = getDistrictCoordinates(district);

  const defaultAvatar = role === ROLES.WORKER
    ? 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80'
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone.trim(),
    role,
    language,
    profileImage: profileImage || defaultAvatar,
    location: {
      address: address || `${district}, Sri Lanka`,
      district,
      latitude: districtCoords.latitude,
      longitude: districtCoords.longitude
    }
  });

  let workerProfile = null;

  // If user registers as a worker, automatically initialize their Worker profile
  if (role === ROLES.WORKER) {
    workerProfile = await Worker.create({
      userId: user._id,
      category: category || 'plumbing',
      district: district || 'Colombo',
      address: address || `${district}, Sri Lanka`,
      latitude: districtCoords.latitude,
      longitude: districtCoords.longitude,
      hourlyRate: Number(hourlyRate) || 1500,
      pricing: {
        basePrice: 500,
        hourlyRate: Number(hourlyRate) || 1500
      },
      profileImage: profileImage || defaultAvatar,
      verified: false,
      verificationStatus: 'Pending',
      availability: true
    });
  }

  const token = generateToken(user);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      profileImage: user.profileImage,
      location: user.location,
      workerProfile
    },
    token
  };
};

/**
 * Log in existing user
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (!user.isActive) {
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  let workerProfile = null;
  if (user.role === ROLES.WORKER) {
    workerProfile = await Worker.findOne({ userId: user._id });
  }

  const token = generateToken(user);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      profileImage: user.profileImage,
      location: user.location,
      workerProfile
    },
    token
  };
};

/**
 * Google Auth Handler (Sign In / Sign Up with Google)
 */
const googleAuth = async (googleData) => {
  const { email, name, profileImage, googleId, role = ROLES.CUSTOMER } = googleData;
  const userEmail = (email || 'google.user@tasklanka.lk').toLowerCase().trim();

  let user = await User.findOne({ email: userEmail });

  if (!user) {
    // Register new user via Google
    const districtCoords = getDistrictCoordinates('Colombo');
    user = await User.create({
      name: name || 'Google User',
      email: userEmail,
      password: `GoogleAuth_${Math.random().toString(36).substring(2, 10)}!`,
      phone: '0771234567',
      role,
      language: 'en',
      profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      location: {
        address: 'Colombo, Sri Lanka',
        district: 'Colombo',
        latitude: districtCoords.latitude,
        longitude: districtCoords.longitude
      }
    });
  }

  let workerProfile = null;
  if (user.role === ROLES.WORKER) {
    workerProfile = await Worker.findOne({ userId: user._id });
  }

  const token = generateToken(user);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      language: user.language,
      profileImage: user.profileImage,
      location: user.location,
      workerProfile
    },
    token
  };
};

/**
 * Request Password Reset / OTP
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new Error('No account found with this email address.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save();

  return {
    message: 'A 6-digit reset code has been sent to your email address.',
    otp // Returned for instant testing simulation
  };
};

/**
 * Reset Password with OTP
 */
const resetPassword = async (email, otp, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    resetPasswordToken: String(otp).trim()
  });

  if (!user) {
    throw new Error('Invalid or expired verification code.');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user);

  return {
    message: 'Password reset successfully. You are now logged in.',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

/**
 * Get current user profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  let workerProfile = null;
  if (user.role === ROLES.WORKER) {
    workerProfile = await Worker.findOne({ userId: user._id });
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    language: user.language,
    profileImage: user.profileImage,
    location: user.location,
    workerProfile
  };
};

/**
 * Update user profile (name, phone, profile image, location, etc.)
 */
const updateUserProfile = async (userId, updateData) => {
  const { name, phone, language, profileImage, location, district, address } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (name && name.trim()) user.name = name.trim();
  if (phone && phone.trim()) user.phone = phone.trim();
  if (language) user.language = language;
  if (profileImage) user.profileImage = profileImage;

  if (district || address || location) {
    const targetDistrict = district || location?.district || user.location?.district || 'Colombo';
    const targetAddress = address || location?.address || user.location?.address || `${targetDistrict}, Sri Lanka`;
    const coords = getDistrictCoordinates(targetDistrict);

    user.location = {
      district: targetDistrict,
      address: targetAddress,
      latitude: location?.latitude || coords.latitude,
      longitude: location?.longitude || coords.longitude
    };
  }

  await user.save();

  let workerProfile = null;
  if (user.role === ROLES.WORKER) {
    workerProfile = await Worker.findOne({ userId: user._id });
    if (workerProfile) {
      if (profileImage) workerProfile.profileImage = profileImage;
      if (district) workerProfile.district = district;
      if (address) workerProfile.address = address;
      await workerProfile.save();
    }
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    language: user.language,
    profileImage: user.profileImage,
    location: user.location,
    workerProfile
  };
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  generateToken
};
