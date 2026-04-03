const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  log_level: {
    type: String,
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
    default: 'info'
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
    request_id: String,
    user_id: mongoose.Schema.Types.ObjectId,
    path: String,
    method: String,
    response_time: Number,
    status_code: Number,
    error_stack: String,
    additional: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

logSchema.index({ log_level: 1 });
logSchema.index({ service: 1, created_at: -1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ user_id: 1 });

logSchema.statics.createLog = async function(level, service, message, metadata = {}) {
  return this.create({
    log_level: level,
    service,
    message,
    metadata
  });
};

logSchema.statics.getErrorLogs = async function(options = {}) {
  const { limit = 100, skip = 0, service = null, startDate = null, endDate = null } = options;
  
  const query = { log_level: 'error' };
  
  if (service) {
    query.service = service;
  }
  
  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) {
      query.created_at.$gte = startDate;
    }
    if (endDate) {
      query.created_at.$lte = endDate;
    }
  }
  
  return this.find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

logSchema.statics.getRecentLogs = async function(options = {}) {
  const { limit = 50, service = null } = options;
  
  const query = {};
  
  if (service) {
    query.service = service;
  }
  
  return this.find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .exec();
};

logSchema.statics.getStats = async function(options = {}) {
  const { days = 7 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        created_at: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: '$log_level',
        count: { $sum: 1 },
        services: { $addToSet: '$service' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
