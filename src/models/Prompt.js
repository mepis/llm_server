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
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'completion', 'instruct', 'custom'],
    default: 'chat'
  },
  tags: {
    type: [String],
    default: []
  },
  is_public: {
    type: Boolean,
    default: false
  },
  variables: [{
    name: String,
    description: String,
    required: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    temperature: {
      type: Number,
      default: 0.7
    },
    max_tokens: {
      type: Number,
      default: 2048
    },
    top_p: {
      type: Number,
      default: 0.9
    },
    frequency_penalty: {
      type: Number,
      default: 0.0
    },
    presence_penalty: {
      type: Number,
      default: 0.0
    }
  },
  usage_count: {
    type: Number,
    default: 0
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

promptSchema.index({ user_id: 1, name: 1 });
promptSchema.index({ is_public: 1, created_at: -1 });
promptSchema.index({ 'tags': 1 });
promptSchema.index({ type: 1 });

promptSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  this.updated_at = new Date();
  return this.save();
};

promptSchema.statics.searchByName = async function(userId, name) {
  const regex = new RegExp(name, 'i');
  return this.find({
    user_id: userId,
    name: regex
  });
};

promptSchema.statics.searchByTag = async function(userId, tag) {
  return this.find({
    user_id: userId,
    tags: tag
  });
};

promptSchema.statics.getPublicPrompts = async function() {
  return this.find({
    is_public: true
  }).select('-user_id');
};

const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
