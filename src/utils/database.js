const { connectDB, disconnectDB, mongoose } = require('../config/db');
const logger = require('../utils/logger');

const setupDatabase = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    
    await db.createCollection('users');
    await db.createCollection('chat_sessions');
    await db.createCollection('rag_documents');
    await db.createCollection('prompts');
    await db.createCollection('tools');
    await db.createCollection('logs');
    await db.createCollection('matrix_messages');
    
    logger.info('Database collections created successfully');
    return true;
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.dropCollection(collection.name);
    }
    
    logger.info('Database cleared successfully');
    return true;
  } catch (error) {
    logger.error('Database clearing failed:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase,
  clearDatabase
};
