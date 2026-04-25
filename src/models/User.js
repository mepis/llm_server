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
  display_name: {
    type: String,
    trim: true
  },
  matrix_username: {
    type: String,
    trim: true
  },
  roles: {
    type: [String],
    default: ['user']
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
    },
    chat_page_size: {
      type: Number,
      default: 10,
      enum: [10, 20, 50]
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
  return await argon2.hash(password);
};

userSchema.statics.verifyPassword = async function(hash, password) {
  return await argon2.verify({ hash, password });
};

userSchema.methods.checkPassword = async function(password) {
  return await argon2.verify({ hash: this.password_hash, password });
};

userSchema.methods.resetPassword = async function(newPassword) {
  this.password_hash = await argon2.hash(newPassword);
  return await this.save();
};

userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

userSchema.methods.hasAnyRole = function(roles) {
  return roles.some(role => this.roles.includes(role));
};

const User = mongoose.model('User', userSchema);

module.exports = User;
