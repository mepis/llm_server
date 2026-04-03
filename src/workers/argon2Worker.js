const logger = require('./logger');

class Argon2Worker {
  static async hashPassword(password) {
    const argon2 = require('argon2');
    return await argon2.hash(password);
  }

  static async verifyPassword(hash, password) {
    const argon2 = require('argon2');
    return await argon2.verify(hash, password);
  }
}

module.exports = Argon2Worker;
