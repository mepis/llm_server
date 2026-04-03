const jwt = require('jsonwebtoken');
const config = require('../config/database');

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

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  validateToken
};
