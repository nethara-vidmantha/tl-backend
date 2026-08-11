require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const Worker = require('./src/models/Worker');
const seedDatabase = require('./src/utils/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB (Atlas or In-Memory fallback)
    await connectDB();

    // 2. Auto-seed if workers collection is missing
    const workerCount = await Worker.countDocuments();
    if (workerCount === 0) {
      console.log('No workers found in database. Initializing automatic Sri Lanka verified workers dataset...');
      await seedDatabase();
    } else {
      console.log(`Verified ${workerCount} active Sri Lankan service workers ready.`);
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
