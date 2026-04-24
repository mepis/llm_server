const mongoose = require('mongoose');

const userMemorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  layer: {
    type: String,
    enum: ['episodic', 'semantic', 'procedural'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  embedding: {
    type: [Number],
    default: []
  },
  metadata: {
    source_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      default: null
    },
    keywords: [{
      type: String,
      trim: true
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    extracted_at: {
      type: Date,
      default: Date.now
    },
    expires_at: {
      type: Date,
      default: null
    },
    last_accessed: {
      type: Date,
      default: null
    },
    access_count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

userMemorySchema.index({ user_id: 1, layer: 1, created_at: -1 });
userMemorySchema.index({ 'metadata.expires_at': 1 }, { expireAfterSeconds: 0 });
userMemorySchema.index({ 'metadata.keywords': 'text', tags: 'text' });

userMemorySchema.pre('save', function(next) {
  if (this.layer === 'episodic' && !this.metadata.expires_at) {
    this.metadata.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

userMemorySchema.methods.recordAccess = function() {
  this.metadata.last_accessed = new Date();
  this.metadata.access_count += 1;
  
  if (this.layer === 'episodic' && this.metadata.access_count % 5 === 0) {
    this.metadata.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.save();
};

userMemorySchema.methods.isExpired = function() {
  if (!this.metadata.expires_at) return false;
  return new Date() > this.metadata.expires_at;
};

userMemorySchema.statics.getByLayer = async function(userId, layer, limit = 10) {
  const query = { user_id: userId, layer };
  
  if (layer === 'episodic') {
    query['metadata.expires_at'] = { $gt: new Date() };
  }
  
  return this.find(query)
    .sort({ created_at: -1 })
    .limit(limit);
};

userMemorySchema.statics.searchSemantic = async function(userId, query) {
  if (query) {
    return this.find({
      user_id: userId,
      layer: 'semantic',
      $text: { $search: query }
    }).sort({ 'metadata.confidence': -1 });
  }
  
  return this.find({
    user_id: userId,
    layer: 'semantic'
  })
    .sort({ created_at: -1 })
    .limit(10);
};

userMemorySchema.statics.getProcedural = async function(userId, limit = 20) {
  return this.find({
    user_id: userId,
    layer: 'procedural'
  })
    .sort({ created_at: -1 })
    .limit(limit);
};

userMemorySchema.statics.cleanupExpired = async function() {
  const now = new Date();
  
  return this.deleteMany({
    layer: 'episodic',
    'metadata.expires_at': { $lt: now }
  });
};

userMemorySchema.statics.consolidateSemantic = async function(userId) {
  const memories = await this.find({ user_id: userId, layer: 'semantic' }).sort({ created_at: -1 });
  
  if (memories.length <= 1) return { merged: 0, originalCount: memories.length };
  
  const toDelete = [];
  
  for (let i = 0; i < memories.length; i++) {
    if (toDelete.includes(memories[i]._id.toString())) continue;
    
    for (let j = i + 1; j < memories.length; j++) {
      if (toDelete.includes(memories[j]._id.toString())) continue;
      
      const overlapCount = memories[i].metadata.keywords.filter(k =>
        memories[j].metadata.keywords.includes(k)
      ).length;
      
      const maxKeywords = Math.max(
        memories[i].metadata.keywords.length,
        memories[j].metadata.keywords.length
      );
      
      if (maxKeywords > 0 && overlapCount / maxKeywords > 0.6) {
        toDelete.push(memories[j]._id.toString());
      }
    }
  }
  
  if (toDelete.length > 0) {
    await this.deleteMany({ _id: { $in: toDelete.map(id => new mongoose.Types.ObjectId(id)) } });
  }
  
  return { merged: toDelete.length, originalCount: memories.length };
};

const UserMemory = mongoose.model('UserMemory', userMemorySchema);

module.exports = UserMemory;
