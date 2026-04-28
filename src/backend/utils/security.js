const crypto = require('crypto');

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
  generateJWTSecret,
  generateId,
  hashFile
};
