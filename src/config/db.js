const knex = require('knex');

let dbConnection = null;

const connectDB = async () => {
  try {
    const config = require('./mariadb');
    dbConnection = knex({
       client: 'mysql2',
      connection: {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        multipleStatements: true,
      },
      pool: config.pool,
    });

    // Test connection
    await dbConnection.raw('SELECT 1');

    console.log('MariaDB connected successfully');
    return dbConnection;
  } catch (error) {
    console.error('MariaDB connection failed:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  if (dbConnection) {
    await dbConnection.destroy();
    console.log('MariaDB disconnected');
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
};
