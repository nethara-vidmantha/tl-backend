require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const seedDatabase = require('./src/utils/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB (Standard or In-Memory fallback)
    await connectDB();

    // 2. Auto-seed if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initializing automatic Sri Lanka seed dataset...');
      await seedDatabase();
    }

    // 3. Start Express HTTP Server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(` Taskලංකා Backend Engine running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Categories:   http://localhost:${PORT}/api/categories`);
      console.log(` Districts:    http://localhost:${PORT}/api/districts`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('Failed to start TaskLanka backend:', error);
    process.exit(1);
  }
};

startServer();
