const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas / Local MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ ERROR: MONGODB_URI (or MONGO_URI) is not defined in environment variables (.env)');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      // Modern mongoose defaults are used
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('💡 Hint for College Demo:');
    console.error('   1. If using MongoDB Atlas: check your cluster connection string and Network Access (whitelist 0.0.0.0/0).');
    console.error('   2. If using local MongoDB: ensure your local MongoDB Community Service is started.');
    // Do not crash the server immediately so developers can view API routes or troubleshoot
  }
};

module.exports = connectDB;
