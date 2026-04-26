require('dotenv').config();

const config = {
  db: {
    host: process.env.MARIADB_HOST || 'localhost',
    port: parseInt(process.env.MARIADB_PORT) || 3306,
    user: process.env.MARIADB_USER || 'root',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'llm_server',
  },
  pool: {
    min: 2,
    max: 10,
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = config;
