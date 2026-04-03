const mongoose = require('mongoose');

const matrixMessageSchema = new mongoose.Schema({
  room_id: {
    type: String,
    required: true,
    trim: true
  },
  user_id: {
    type: String,
    required: true,
    trim: true
  },
  message_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['m.text', 'm.image', 'm.file', 'm.emote'],
    default: 'm.text'
  },
  is_incoming: {
    type: Boolean,
    required: true
  },
  sender_display_name: {
    type: String,
    default: null
  },
  attachments: [{
    url: String,
    content_type: String,
    size: Number,
    name: String
  }],
  metadata: {
    transaction_id: String,
    device_id: String,
    user_agent: String
  },
  received_at: {
    type: Date,
    default: Date.now
  },
  processed_at: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['received', 'processing', 'processed', 'error'],
    default: 'received'
  },
  error_message: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

matrixMessageSchema.index({ room_id: 1, received_at: -1 });
matrixMessageSchema.index({ user_id: 1, received_at: -1 });
matrixMessageSchema.index({ message_id: 1 });
matrixMessageSchema.index({ is_incoming: 1 });
matrixMessageSchema.index({ status: 1 });

matrixMessageSchema.statics.processMessage = async function(messageId) {
  return this.findOneAndUpdate(
    { message_id: messageId },
    { processed_at: new Date(), status: 'processed' },
    { new: true }
  );
};

matrixMessageSchema.statics.setError = async function(messageId, errorMessage) {
  return this.findOneAndUpdate(
    { message_id: messageId },
    { status: 'error', error_message: errorMessage },
    { new: true }
  );
};

matrixMessageSchema.statics.getUnprocessedMessages = async function() {
  return this.find({
    status: { $in: ['received', 'processing'] }
  }).sort({ received_at: 1 });
};

matrixMessageSchema.statics.getMessageCount = async function(roomId, options = {}) {
  const { days = 7 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.countDocuments({
    room_id: roomId,
    received_at: { $gte: cutoffDate }
  });
};

matrixMessageSchema.statics.getRecentMessages = async function(roomId, limit = 50) {
  return this.find({
    room_id: roomId
  }).sort({ received_at: -1 }).limit(limit);
};

const MatrixMessage = mongoose.model('MatrixMessage', matrixMessageSchema);

module.exports = MatrixMessage;
