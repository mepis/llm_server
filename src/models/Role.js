const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  is_builtin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

roleSchema.index({ name: 1 });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
