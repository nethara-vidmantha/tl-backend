const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Worker = require('../models/Worker');
const { ROLES } = require('../config/constants');
const { getDistrictCoordinates } = require('./locationService');
const { sendPasswordResetEmail } = require('./emailService');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'tasklanka_secret_key',
    {
      expiresIn: '30d'
    }
  );
};

/**
 * Register a new user (Customer or Worker)
 */
const registerUser = async (userData) => {
  const {
    name,
    email,
    password,
    phone,
    role = ROLES.CUSTOMER,
    language = 'en',
    district = 'Colombo',
    address,
    profileImage,
    category,
    hourlyRate,
    experience,
    skills,
    nicNumber
  } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new Error('A user with this email address already exists.');
  }

  // Calculate coordinates based on district
  const districtCoords = getDistrictCoordinates(district);

  // 1. Create Base User
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    phone,
    role,
    language,
    profileImage: profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    location: {
      address: address || `${district}, Sri Lanka`,
      district: district || 'Colombo',
      latitude: districtCoords.latitude,
      longitude: districtCoords.longitude
    }
  });

  // 2. If registering as a Worker, create Worker profile
  let workerProfile = null;
  if (role === ROLES.WORKER) {
    workerProfile = await Worker.create({
      userId: user._id,
      name: user.name,
      phone: user.phone,
      category: category || 'plumbing',
      hourlyRate: hourlyRate || 1500,
      profileImage: user.profileImage,
      district: district || 'Colombo',
      address: address || `${district}, Sri Lanka`,
      location: {
        type: 'Point',
        coordinates: [districtCoords.longitude, districtCoords.latitude]
      },
      experience: experience || 2,
      skills: Array.isArray(skills) ? skills : ['General Repairs'],
      nicVerification: {
        nicNumber: nicNumber || '',
        verified: false
      },
      verified: true // Auto-verified for instant marketplace onboarding
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
 * Login existing user
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
  let { email, name, profileImage, accessToken, idToken, role = ROLES.CUSTOMER } = googleData;

  // If accessToken is provided, verify with Google UserInfo API
  if (accessToken) {
    try {
      const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (gRes.ok) {
        const gInfo = await gRes.json();
        email = gInfo.email || email;
        name = gInfo.name || name;
        profileImage = gInfo.picture || profileImage;
      }
    } catch (gErr) {
      console.warn('Google userinfo fetch fallback:', gErr.message);
    }
  }

  if (!email) {
    throw new Error('Google authentication failed: Email is required.');
  }

  const userEmail = email.toLowerCase().trim();
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
  } else if (profileImage && (!user.profileImage || user.profileImage.includes('unsplash'))) {
    user.profileImage = profileImage;
    await user.save();
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
 * Request Password Reset / OTP with Real Email Sending
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

  // Send real email via Gmail SMTP
  await sendPasswordResetEmail(user.email, otp, user.name);

  return {
    message: 'A 6-digit verification code has been sent to your email address.'
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
 * Update user profile
 */
const updateUserProfile = async (userId, updateData) => {
  const { name, phone, language, address, district, profileImage } = updateData;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (language) user.language = language;
  if (profileImage) user.profileImage = profileImage;

  if (district || address) {
    const d = district || user.location?.district || 'Colombo';
    const coords = getDistrictCoordinates(d);
    user.location = {
      district: d,
      address: address || user.location?.address || `${d}, Sri Lanka`,
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  }

  await user.save();

  // If user is a worker, sync name and profileImage to Worker model
  let workerProfile = null;
  if (user.role === ROLES.WORKER) {
    workerProfile = await Worker.findOneAndUpdate(
      { userId: user._id },
      {
        name: user.name,
        phone: user.phone,
        profileImage: user.profileImage,
        district: user.location.district,
        address: user.location.address
      },
      { new: true }
    );
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
  updateUserProfile
};
