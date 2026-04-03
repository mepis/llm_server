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
    trim: true,
    maxlength: 100,
    unique: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  code: {
    type: String,
    required: true
  },
  parameters: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  return_type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object', 'json'],
    default: 'string'
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    author: String,
    dependencies: [String],
    examples: [{
      input: mongoose.Schema.Types.Mixed,
      expected_output: mongoose.Schema.Types.Mixed
    }]
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

toolSchema.index({ user_id: 1, name: 1 });
toolSchema.index({ is_active: 1 });
toolSchema.index({ created_at: -1 });

toolSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  this.updated_at = new Date();
  return this.save();
};

toolSchema.methods.addExample = function(example) {
  if (!this.metadata.examples) {
    this.metadata.examples = [];
  }
  this.metadata.examples.push(example);
  return this.save();
};

toolSchema.statics.searchByName = async function(userId, name) {
  const regex = new RegExp(name, 'i');
  return this.find({
    user_id: userId,
    name: regex
  });
};

toolSchema.statics.searchByParameter = async function(userId, paramName) {
  return this.find({
    user_id: userId,
    parameters: { $elemMatch: { name: paramName } }
  });
};

toolSchema.statics.getActiveTools = async function(userId) {
  return this.find({
    user_id: userId,
    is_active: true
  });
};

const Tool = mongoose.model('Tool', toolSchema);

module.exports = Tool;
