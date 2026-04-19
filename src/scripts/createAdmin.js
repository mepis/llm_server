require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/database');

const createAdminUser = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.disconnect();
      return;
    }
    
    // Create admin user with argon2 hash
    const hashedPassword = await User.hashPassword('admin123');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hashedPassword,
      roles: ['admin', 'user']
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
