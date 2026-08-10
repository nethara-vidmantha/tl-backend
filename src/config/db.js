const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri !== 'mongodb://localhost:27017/tasklanka_memory') {
      try {
        console.log(`Connecting to MongoDB at ${mongoUri.split('@').pop()}...`);
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 3000
        });
        console.log('MongoDB connected successfully via URI.');
        return;
      } catch (uriErr) {
        console.warn('Could not connect to external MongoDB URI, falling back to embedded MongoDB engine:', uriErr.message);
      }
    }

    // Zero-config fallback: MongoMemoryServer for instant execution without local Mongo installation
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
