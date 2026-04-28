const { getDB } = require('../config/db');
const logger = require('../utils/logger');
const { createTables, dropTables } = require('../db/schema');

const setupDatabase = async () => {
  try {
    const db = getDB();
    await createTables(db);
    logger.info('Database tables created successfully');
    return true;
  } catch (error) {
    logger.error('Database setup failed:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    const db = getDB();
    await dropTables(db);
    logger.info('Database cleared successfully');
    return true;
  } catch (error) {
    logger.error('Database clearing failed:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase,
  clearDatabase,
};
