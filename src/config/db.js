const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    // Use Memory Server during test mode
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      return;
    }

    if (mongoUri && mongoUri !== 'mongodb://localhost:27017/tasklanka_memory') {
      try {
        const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log(`Connecting to MongoDB Atlas at ${maskedUri}...`);
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000
        });
        console.log('MongoDB Atlas connected successfully.');
        return;
      } catch (uriErr) {
        console.warn('Could not connect to external MongoDB URI, falling back to embedded MongoDB engine:', uriErr.message);
      }
    }

    // Fallback: MongoMemoryServer for instant offline execution if needed
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`Embedded MongoDB connected successfully (${uri})`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.error('Error disconnecting DB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
