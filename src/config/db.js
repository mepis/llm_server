const config = require('./database');

let dbConnection = null;

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
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
