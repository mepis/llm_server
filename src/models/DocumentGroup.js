const mongoose = require('mongoose');

const documentGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'private'
  },
  members: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    }
  }],
  documents: [{
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RAGDocument',
      required: true
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    added_at: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

documentGroupSchema.index({ owner_id: 1 });
documentGroupSchema.index({ visibility: 1 });
documentGroupSchema.index({ 'members.user_id': 1 });
documentGroupSchema.index({ name: 1, owner_id: 1 }, { unique: true });

documentGroupSchema.methods.isOwner = function(userId) {
  return this.owner_id.toString() === userId.toString();
};

documentGroupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user_id.toString() === userId.toString());
};

documentGroupSchema.methods.getRole = function(userId) {
  const member = this.members.find(m => m.user_id.toString() === userId.toString());
  return member ? member.role : null;
};

documentGroupSchema.methods.canEdit = function(userId) {
  const role = this.getRole(userId);
  return role === 'owner' || role === 'editor';
};

documentGroupSchema.methods.canView = function(userId) {
  if (this.isOwner(userId)) return true;
  if (this.isMember(userId)) return true;
  if (this.visibility === 'public') return true;
  return false;
};

documentGroupSchema.statics.getUserGroups = async function(userId) {
  return this.find({
    $or: [
      { owner_id: userId },
      { 'members.user_id': userId }
    ]
  }).populate('owner_id', 'username email');
};

documentGroupSchema.statics.getPublicGroups = async function() {
  return this.find({ visibility: 'public' })
    .populate('owner_id', 'username email')
    .sort({ created_at: -1 });
};

const DocumentGroup = mongoose.model('DocumentGroup', documentGroupSchema);

module.exports = DocumentGroup;
