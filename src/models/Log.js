const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  log_level: {
    type: String,
    enum: ['error', 'warn', 'info', 'debug'],
    required: true
  },
  service: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

logSchema.index({ timestamp: -1 });
logSchema.index({ log_level: 1, timestamp: -1 });
logSchema.index({ service: 1, timestamp: -1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
