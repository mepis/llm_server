const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['system', 'user', 'assistant', 'custom'],
    default: 'custom'
  },
  variables: [{
    name: String,
    default: String
  }],
  settings: {
    model: String,
    temperature: Number,
    max_tokens: Number,
    top_p: Number
  },
  tags: [{
    type: String,
    trim: true
  }],
  is_public: {
    type: Boolean,
    default: false
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

promptSchema.index({ user_id: 1, created_at: -1 });
promptSchema.index({ name: 1 });

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
