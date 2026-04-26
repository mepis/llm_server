require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const knex = () => require('../config/db').getDB();

const createAdminUser = async () => {
  try {
    await connectDB();
    console.log('Connected to MariaDB');

    const existingAdmin = await knex().from('users').where({ username: 'admin' }).first();
    if (existingAdmin) {
      console.log('Admin user already exists');
      await disconnectDB();
      return;
    }

    const passwordHash = await require('node-argon2').hash('admin123');
    const id = require('uuid').v4();
    await knex().insert({
      id,
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      roles: JSON.stringify(['admin', 'user']),
    }).into('users');

    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    await disconnectDB();
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
