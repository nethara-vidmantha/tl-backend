require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { ROLES, BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, NOTIFICATION_TYPES } = require('../config/constants');

const seedDatabase = async () => {
  try {
    console.log('Seeding TaskLanka Database with realistic Sri Lankan datasets...');
    await connectDB();

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Worker.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('Cleared existing collections.');

    const defaultPassword = 'password123';

    // 1. Create Core Demo Accounts
    const customerUser = await User.create({
      name: 'Nethara Vidmantha',
      email: 'customer@tasklanka.lk',
      password: defaultPassword,
      phone: '0771234567',
      role: ROLES.CUSTOMER,
      language: 'en',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      location: {
        address: 'Bambalapitiya, Colombo 04',
        district: 'Colombo',
        latitude: 6.8969,
        longitude: 79.8576
      }
    });

    const adminUser = await User.create({
      name: 'TaskLanka Administrator',
      email: 'admin@tasklanka.lk',
      password: defaultPassword,
      phone: '0719999999',
      role: ROLES.ADMIN,
      language: 'en',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      location: {
        address: 'World Trade Center, Colombo 01',
        district: 'Colombo',
        latitude: 6.9333,
        longitude: 79.8433
      }
    });

    // 2. Worker Dataset
    const workersData = [
      // Colombo Workers
      {
        name: 'Kasun Fernando',
        email: 'worker@tasklanka.lk', // Primary demo worker
        phone: '0772345678',
        category: 'plumbing',
        district: 'Colombo',
        address: 'Havelock Road, Colombo 05',
        latitude: 6.8833,
        longitude: 79.8655,
        experience: 7,
        description: 'Certified Master Plumber. Expert in high-pressure pipe repairs, bathroom fitting installations, leak detection, and water pump overhauls.',
        skills: ['Pipe Leak Repair', 'Bathroom Fitting', 'Water Heater Installation', 'Drain Unclogging', 'Pump Repair'],
        hourlyRate: 1500,
        rating: 4.9,
        totalReviews: 28,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Ruwan Perera',
        email: 'ruwan.perera@tasklanka.lk',
        phone: '0712345678',
        category: 'electrical',
        district: 'Colombo',
        address: 'Rajagiriya, Colombo',
        latitude: 6.9088,
        longitude: 79.8974,
        experience: 9,
        description: 'Licensed CEB certified electrician. Specializing in complete domestic wiring, circuit breaker tripping fixes, solar inverter setups, and lighting design.',
        skills: ['House Wiring', 'Trip Switch Repairs', 'Solar Inverter Setup', 'Fan & Light Installation', 'Surge Protection'],
        hourlyRate: 1800,
        rating: 4.8,
        totalReviews: 34,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Dr. Priyantha Jayasuriya',
        email: 'priyantha.doc@tasklanka.lk',
        phone: '0761234567',
        category: 'medical',
        district: 'Colombo',
        address: 'Narahenpita, Colombo 05',
        latitude: 6.8988,
        longitude: 79.8788,
        experience: 12,
        description: 'General Physician & Home Medical Consultant. Providing comprehensive health checkups, elderly health monitoring, prescription review, and post-surgery care.',
        skills: ['General Health Check', 'Elderly Medical Care', 'ECG & Blood Pressure', 'Wound Dressing', 'Post-Op Monitoring'],
        hourlyRate: 3500,
        rating: 5.0,
        totalReviews: 42,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Sunil Shantha',
        email: 'sunil.carpenter@tasklanka.lk',
        phone: '0751234567',
        category: 'carpentry',
        district: 'Colombo',
        address: 'Moratuwa, Colombo',
        latitude: 6.7730,
        longitude: 79.8816,
        experience: 15,
        description: 'Master craftsman from Moratuwa wood hub. Teak furniture repair, door lock realignment, custom kitchen pantries, and timber restoration.',
        skills: ['Furniture Repair', 'Door & Window Fitting', 'Custom Pantry', 'Roof Woodwork', 'Varnishing & Polishing'],
        hourlyRate: 1600,
        rating: 4.7,
        totalReviews: 19,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Sandya Kumari',
        email: 'sandya.care@tasklanka.lk',
        phone: '0781234567',
        category: 'caregiving',
        district: 'Colombo',
        address: 'Nugegoda, Colombo',
        latitude: 6.8649,
        longitude: 79.8997,
        experience: 6,
        description: 'Certified caregiver with red cross training. Empathetic elderly care, mobility assistance, medication reminders, and companionship.',
        skills: ['Elderly Assistance', 'Bedridden Patient Care', 'Medication Management', 'Mobility Support', 'Nutritional Meal Prep'],
        hourlyRate: 1200,
        rating: 4.9,
        totalReviews: 23,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
      },

      // Matara Workers (Crucial for PickMe style test case: Colombo customer booking in Matara)
      {
        name: 'Nimal Silva',
        email: 'nimal.matara@tasklanka.lk',
        phone: '0773344556',
        category: 'plumbing',
        district: 'Matara',
        address: 'Nupe Junction, Matara',
        latitude: 5.9520,
        longitude: 80.5480,
        experience: 8,
        description: 'Experienced Southern province plumbing technician. Rapid response for overhead tank repairs, well-pump motors, and kitchen drainage in Matara.',
        skills: ['Water Tank Setup', 'Tube Well Pumps', 'Drain Unblocking', 'Bathroom Plumbing', 'Emergency Leaks'],
        hourlyRate: 1200,
        rating: 4.8,
        totalReviews: 16,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Kamala Devi',
        email: 'kamala.matara@tasklanka.lk',
        phone: '0714455667',
        category: 'caregiving',
        district: 'Matara',
        address: 'Kotuwegoda, Matara',
        latitude: 5.9450,
        longitude: 80.5590,
        experience: 5,
        description: 'Dedicated nursing assistant in Matara district. Experienced in infant & elderly care, hygiene support, and home recovery.',
        skills: ['Elderly Care', 'Infant Care', 'Vital Signs Monitoring', 'Physical Therapy Assistance'],
        hourlyRate: 1000,
        rating: 4.9,
        totalReviews: 12,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
      },

      // Kandy Workers
      {
        name: 'Chaminda Bandara',
        email: 'chaminda.kandy@tasklanka.lk',
        phone: '0775566778',
        category: 'electrical',
        district: 'Kandy',
        address: 'Peradeniya Road, Kandy',
        latitude: 7.2710,
        longitude: 80.6050,
        experience: 10,
        description: 'High-voltage domestic and commercial electrical technician in Central Province. Generator connections and earthing systems.',
        skills: ['Generator Wiring', 'Main Board Setup', 'LED Profile Lights', 'Industrial Inverters', 'Appliance Repair'],
        hourlyRate: 1600,
        rating: 4.9,
        totalReviews: 31,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80'
      },
      {
        name: 'Anoma Dissanayake',
        email: 'anoma.tutor@tasklanka.lk',
        phone: '0716677889',
        category: 'teaching',
        district: 'Kandy',
        address: 'Katugastota, Kandy',
        latitude: 7.3240,
        longitude: 80.6220,
        experience: 8,
        description: 'B.Sc Graduate Teacher providing structured tuition for Combined Mathematics, O/L Science, and English medium curriculum.',
        skills: ['O/L Science', 'A/L Combined Maths', 'English Grammar', 'Individual Attention', 'Exam Past Papers'],
        hourlyRate: 2000,
        rating: 5.0,
        totalReviews: 27,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
      },

      // Galle Workers
      {
        name: 'Sanjeewa Jayasinghe',
        email: 'sanjeewa.galle@tasklanka.lk',
        phone: '0777788990',
        category: 'carpentry',
        district: 'Galle',
        address: 'Galle Fort & Karapitiya',
        latitude: 6.0350,
        longitude: 80.2170,
        experience: 11,
        description: 'Colonial timber restoration, antique furniture preservation, and modern modular cabinets in Galle district.',
        skills: ['Antique Wood Restoration', 'Modern Kitchen Cabinets', 'Decking & Pergolas', 'Wooden Flooring'],
        hourlyRate: 1500,
        rating: 4.8,
        totalReviews: 18,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      },

      // Gampaha Workers
      {
        name: 'Ranjith Weerasinghe',
        email: 'ranjith.gardener@tasklanka.lk',
        phone: '0788899001',
        category: 'gardening',
        district: 'Gampaha',
        address: 'Kadawatha, Gampaha',
        latitude: 7.0010,
        longitude: 79.9520,
        experience: 9,
        description: 'Landscape design, grass cutting, tree pruning, organic vegetable patch setup, and automated drip irrigation.',
        skills: ['Lawn Mowing', 'Landscape Beautification', 'Tree Trimming', 'Organic Fertilizer', 'Drip Irrigation'],
        hourlyRate: 1100,
        rating: 4.7,
        totalReviews: 15,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'
      },

      // Jaffna Workers
      {
        name: 'Suresh Kumar',
        email: 'suresh.jaffna@tasklanka.lk',
        phone: '0779900112',
        category: 'plumbing',
        district: 'Jaffna',
        address: 'Nallur, Jaffna',
        latitude: 9.6740,
        longitude: 80.0290,
        experience: 6,
        description: 'Northern province domestic water specialist. Reverse osmosis water filter installation and deep well pipe mechanics.',
        skills: ['RO Filter Setup', 'Deep Well Maintenance', 'PVC Pipe Welding', 'Solar Water Heaters'],
        hourlyRate: 1300,
        rating: 4.9,
        totalReviews: 21,
        verified: true,
        verificationStatus: 'Verified',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80'
      },

      // Pending Verification Worker (for Admin verification demo)
      {
        name: 'Malik Jayawardena',
        email: 'malik.new@tasklanka.lk',
        phone: '0711122334',
        category: 'cleaning',
        district: 'Colombo',
        address: 'Battaramulla, Colombo',
        latitude: 6.8990,
        longitude: 79.9180,
        experience: 4,
        description: 'Deep residential cleaning, sofa shampooing, carpet steam cleaning, and post-construction sanitization.',
        skills: ['Deep Home Cleaning', 'Sofa Steam Clean', 'Floor Scrubbing', 'Window Glass Polish'],
        hourlyRate: 1000,
        rating: 5.0,
        totalReviews: 0,
        verified: false,
        verificationStatus: 'Pending',
        availability: true,
        profileImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80'
      }
    ];

    const createdWorkers = [];

    for (const wData of workersData) {
      const u = await User.create({
        name: wData.name,
        email: wData.email,
        password: defaultPassword,
        phone: wData.phone,
        role: ROLES.WORKER,
        language: 'en',
        profileImage: wData.profileImage,
        location: {
          address: wData.address,
          district: wData.district,
          latitude: wData.latitude,
          longitude: wData.longitude
        }
      });

      const workerDoc = await Worker.create({
        userId: u._id,
        category: wData.category,
        district: wData.district,
        address: wData.address,
        latitude: wData.latitude,
        longitude: wData.longitude,
        experience: wData.experience,
        description: wData.description,
        skills: wData.skills,
        hourlyRate: wData.hourlyRate,
        pricing: {
          basePrice: 500,
          hourlyRate: wData.hourlyRate
        },
        rating: wData.rating,
        totalReviews: wData.totalReviews,
        verified: wData.verified,
        verificationStatus: wData.verificationStatus,
        nicVerification: {
          nicNumber: '198812345678',
          nicImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
          submittedAt: new Date()
        },
        availability: wData.availability,
        profileImage: wData.profileImage
      });

      createdWorkers.push(workerDoc);
    }

    console.log(`Created ${createdWorkers.length} Sri Lankan Service Workers.`);

    // 3. Seed Sample Completed Bookings with Reviews and Payments
    const primaryWorker = createdWorkers[0]; // Kasun Fernando (Plumber)
    const mataraWorker = createdWorkers[5]; // Nimal Silva (Matara Plumber)

    // Completed Booking 1
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    const booking1 = await Booking.create({
      customerId: customerUser._id,
      workerId: primaryWorker._id,
      serviceType: 'Plumbing Repair',
      description: 'Main kitchen sink pipe was burst and leaking water under the cabinet.',
      bookingDate: pastDate.toISOString().split('T')[0],
      bookingTime: '02:00 PM',
      location: {
        address: '14/2 Galle Road, Bambalapitiya, Colombo 04',
        district: 'Colombo',
        latitude: 6.8969,
        longitude: 79.8576,
        landmark: 'Opposite Majestic City'
      },
      hourlyRate: primaryWorker.hourlyRate,
      serviceStartTime: new Date(pastDate.getTime() - 2 * 60 * 60 * 1000),
      serviceEndTime: pastDate,
      hoursWorked: 2.0,
      amount: primaryWorker.hourlyRate * 2, // LKR 3000
      status: BOOKING_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      paymentMethod: PAYMENT_METHODS.CARD
    });

    await Payment.create({
      bookingId: booking1._id,
      customerId: customerUser._id,
      workerId: primaryWorker._id,
      amount: 3000,
      method: PAYMENT_METHODS.CARD,
      status: PAYMENT_STATUS.COMPLETED,
      transactionReference: `TXN-LKA-DEMO-001`,
      paymentDetails: {
        cardBrand: 'Visa',
        cardLast4: '4242',
        note: 'Payment for 2 hours of plumbing repair'
      }
    });

    await Review.create({
      workerId: primaryWorker._id,
      customerId: customerUser._id,
      bookingId: booking1._id,
      rating: 5,
      comment: 'Kasun arrived on time with proper replacement copper valves. Fixed the high pressure leak in no time. Highly recommended!'
    });

    // Completed Booking 2 (PickMe style demo: Customer in Colombo booked for Matara)
    const pastDate2 = new Date();
    pastDate2.setDate(pastDate2.getDate() - 5);

    const booking2 = await Booking.create({
      customerId: customerUser._id,
      workerId: mataraWorker._id,
      serviceType: 'Water Tank Overhaul',
      description: 'Overhead tank sensor replacement for my parents house in Matara.',
      bookingDate: pastDate2.toISOString().split('T')[0],
      bookingTime: '10:30 AM',
      location: {
        address: 'No 45, Beach Road, Kotuwegoda, Matara',
        district: 'Matara',
        latitude: 5.9450,
        longitude: 80.5590,
        landmark: 'Near Matara Bodhiya'
      },
      hourlyRate: mataraWorker.hourlyRate,
      serviceStartTime: new Date(pastDate2.getTime() - 3 * 60 * 60 * 1000),
      serviceEndTime: pastDate2,
      hoursWorked: 3.0,
      amount: mataraWorker.hourlyRate * 3, // LKR 3600
      status: BOOKING_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      paymentMethod: PAYMENT_METHODS.QR
    });

    await Payment.create({
      bookingId: booking2._id,
      customerId: customerUser._id,
      workerId: mataraWorker._id,
      amount: 3600,
      method: PAYMENT_METHODS.QR,
      status: PAYMENT_STATUS.COMPLETED,
      transactionReference: `TXN-LKA-DEMO-002`,
      paymentDetails: {
        qrReference: 'LANKAQR-DEMO-EMVCO-VALID',
        note: 'Paid via LankaQR scanning'
      }
    });

    await Review.create({
      workerId: mataraWorker._id,
      customerId: customerUser._id,
      bookingId: booking2._id,
      rating: 5,
      comment: 'I arranged this from Colombo for my mother in Matara. Nimal was extremely polite, honest and did a solid job.'
    });

    // 4. Seed an Active / Pending Booking for live testing
    const todayStr = new Date().toISOString().split('T')[0];
    await Booking.create({
      customerId: customerUser._id,
      workerId: primaryWorker._id,
      serviceType: 'Bathroom Fixture Installation',
      description: 'Need to install new shower mixer and repair hot water geyser outlet.',
      bookingDate: todayStr,
      bookingTime: '04:00 PM',
      location: {
        address: 'Bambalapitiya Flats, Colombo 04',
        district: 'Colombo',
        latitude: 6.8969,
        longitude: 79.8576,
        landmark: 'Block C'
      },
      hourlyRate: primaryWorker.hourlyRate,
      hoursWorked: 1.5,
      amount: primaryWorker.hourlyRate * 1.5,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING
    });

    // Seed sample notification
    await Notification.create({
      userId: customerUser._id,
      title: 'Welcome to Taskලංකා!',
      message: 'Find verified electricians, plumbers, doctors, and tutors near you with instant booking and hourly rate transparency.',
      type: NOTIFICATION_TYPES.SYSTEM,
      isRead: false
    });

    console.log('\n=============================================');
    console.log(' TaskLanka Database Seeded Successfully! ');
    console.log('=============================================');
    console.log('Demo Customer:  customer@tasklanka.lk  | Password: password123');
    console.log('Demo Worker:    worker@tasklanka.lk    | Password: password123 (Kasun - Plumber)');
    console.log('Demo Admin:     admin@tasklanka.lk     | Password: password123');
    console.log('=============================================\n');

    if (process.argv.includes('--disconnect')) {
      await disconnectDB();
    }
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeding finished.');
    process.exit(0);
  });
}

module.exports = seedDatabase;
