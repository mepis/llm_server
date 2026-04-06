const mongoose = require('mongoose');
const argon2 = require('node-argon2');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password_hash: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    default: ['user'],
    enum: ['user', 'admin', 'system']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      default: 'light'
    },
    default_model: {
      type: String,
      default: 'llama-3-8b'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.index({ created_at: -1 });

userSchema.statics.hashPassword = async function(password) {
  return await argon2.hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });
};

userSchema.statics.verifyPassword = async function(hash, password) {
  return await argon2.verify(hash, password);
};

userSchema.methods.checkPassword = async function(password) {
  return await argon2.verify(this.password_hash, password);
};

userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

userSchema.methods.hasAnyRole = function(roles) {
  return roles.some(role => this.roles.includes(role));
};

const User = mongoose.model('User', userSchema);

module.exports = User;
