const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  parameters: [{
    name: String,
    type: String,
    required: Boolean,
    description: String
  }],
  is_active: {
    type: Boolean,
    default: true
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

const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;
