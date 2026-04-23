const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  }
}, { _id: false });

const toolSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  parameters: {
    type: [parameterSchema],
    default: []
  },
  is_active: {
    type: Boolean,
    default: true
  },
  roles: {
    type: [String],
    default: ['user']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

toolSchema.index({ user_id: 1, created_at: -1 });
toolSchema.index({ name: 1 });
toolSchema.index({ roles: 1 });

const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;
