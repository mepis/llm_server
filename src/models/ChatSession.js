const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  messages: [{
    role: {
      type: String,
      enum: ['system', 'user', 'assistant', 'tool'],
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    tool_calls: [{
      id: String,
      type: String,
      function: {
        name: String,
        arguments: String
      }
    }],
    tool_call_id: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      model: String,
      tokens_used: Number,
      embedding_used: Boolean,
      type: mongoose.Schema.Types.Mixed
    }
  }],
  memory: {
    conversation_summary: String,
    key_points: [String],
    entities: [String],
    preferences: mongoose.Schema.Types.Mixed
  },
  metadata: {
    model: {
      type: String,
      default: 'llama-3-8b'
    },
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
    }
  },
  rag_enabled: {
    type: Boolean,
    default: false
  },
  rag_document_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RAGDocument'
  }],
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

chatSessionSchema.index({ user_id: 1, created_at: -1 });
chatSessionSchema.index({ session_name: 1 });
chatSessionSchema.index({ 'messages.timestamp': -1 });

chatSessionSchema.virtual('message_count').get(function() {
  return this.messages.length;
});

chatSessionSchema.virtual('chat_id').get(function() {
  return this._id.toString();
});

chatSessionSchema.set('toJSON', {
  virtuals: true
});

chatSessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  const msg = {
    role,
    content: content || '',
    timestamp: new Date(),
    metadata: metadata || {}
  };

  if (metadata && metadata.tool_calls) {
    msg.tool_calls = metadata.tool_calls;
  }

  this.messages.push(msg);
  this.updated_at = new Date();
  return this.save();
};

chatSessionSchema.methods.clearMessages = function() {
  this.messages = [];
  return this.save();
};

chatSessionSchema.methods.updateMemory = function(memoryData) {
  this.memory = {
    ...this.memory,
    ...memoryData
  };
  return this.save();
};

chatSessionSchema.methods.addRagDocument = function(documentId) {
  if (!this.rag_document_ids.includes(documentId)) {
    this.rag_document_ids.push(documentId);
    return this.save();
  }
  return this;
};

chatSessionSchema.methods.removeRagDocument = function(documentId) {
  this.rag_document_ids = this.rag_document_ids.filter(
    id => id.toString() !== documentId.toString()
  );
  return this.save();
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
