const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/database');

// JWT Token Functions
const generateToken = (userId, username, roles) => {
  return jwt.sign(
    {
      user_id: userId,
      username: username,
      roles: roles
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresin }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error(error.message);
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

const validateToken = (token) => {
  try {
    verifyToken(token);
    return true;
  } catch (error) {
    return false;
  }
};

// Crypto Utility Functions
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const hashFile = (buffer, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(buffer).digest('hex');
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  validateToken
};
