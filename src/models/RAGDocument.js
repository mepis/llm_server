const mongoose = require('mongoose');

const ragDocumentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  file_type: {
    type: String,
    required: true,
    enum: ['pdf', 'txt', 'doc', 'docx', 'md', 'json', 'csv', 'xlsx'],
    match: /^(pdf|txt|doc|docx|md|json|csv|xlsx)$/
  },
  file_size: {
    type: Number,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embeddings: {
    type: [[Number]],
    default: []
  },
  chunked_content: [{
    text: String,
    embedding: [Number],
    chunk_index: Number
  }],
  metadata: {
    source_url: String,
    description: String,
    tags: [String],
    created_at: Date,
    modified_at: Date,
    sheets: [String],
    parse_error: String
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'indexed', 'failed'],
    default: 'uploaded'
  },
  error_message: {
    type: String,
    default: null
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  },
  processed_at: {
    type: Date,
    default: null
  },
  embedding_model: {
    type: String,
    default: 'all-MiniLM-L6-v2'
  },
  group_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentGroup'
  }]
}, {
  timestamps: true
});

ragDocumentSchema.index({ user_id: 1, created_at: -1 });
ragDocumentSchema.index({ filename: 1 });
ragDocumentSchema.index({ status: 1 });
ragDocumentSchema.index({ 'chunked_content.chunk_index': 1 });
ragDocumentSchema.index({ group_ids: 1, status: 1 });

ragDocumentSchema.methods.addChunk = function(chunkData) {
  this.chunked_content.push(chunkData);
  return this.save();
};

ragDocumentSchema.methods.setEmbeddings = function(embeddings) {
  this.embeddings = embeddings;
  this.status = 'indexed';
  this.processed_at = new Date();
  return this.save();
};

ragDocumentSchema.methods.setProcessingError = function(errorMessage) {
  this.status = 'failed';
  this.error_message = errorMessage;
  return this.save();
};

ragDocumentSchema.statics.getIndexedCount = async function(userId) {
  return this.countDocuments({
    user_id: userId,
    status: 'indexed'
  });
};

ragDocumentSchema.statics.searchByTags = async function(userId, tags) {
  return this.find({
    user_id: userId,
    'metadata.tags': { $in: tags }
  });
};

const RAGDocument = mongoose.model('RAGDocument', ragDocumentSchema);

module.exports = RAGDocument;
