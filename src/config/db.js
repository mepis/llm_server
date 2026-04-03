const mongoose = require('mongoose');
const config = require('./database');
const logger = require('../utils/logger');

let dbConnection = null;

const connectDB = async () => {
  try {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ...config.mongodb.options
    };

    await mongoose.connect(config.mongodb.uri, opts);
    dbConnection = mongoose.connection;
    
    dbConnection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    dbConnection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    dbConnection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });
    
    return dbConnection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

const disconnectDB = async () => {
  if (dbConnection) {
    await dbConnection.close();
    logger.info('MongoDB disconnected');
  }
};

const getDB = () => {
  if (!dbConnection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return dbConnection;
};

module.exports = {
  connectDB,
  disconnectDB,
  getDB,
  mongoose
};
