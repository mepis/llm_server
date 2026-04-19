const Log = require('../models/Log');
const logger = require('../utils/logger');

const createLog = async (level, service, message, metadata = {}) => {
  try {
    const log = await Log.create({
      log_level: level,
      service,
      message,
      metadata
    });
    
    return {
      success: true,
      data: log
    };
  } catch (error) {
    logger.error('Create log failed:', error.message);
    throw error;
  }
};

const getLogs = async (options = {}) => {
  try {
    const { level, service, startTime, endTime, page = 1, limit = 100 } = options;
    const query = {};
    
    if (level) query.log_level = level;
    if (service) query.service = service;
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }
    
    const total = await Log.countDocuments(query);
    const skip = (page - 1) * limit;
    
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      success: true,
      data: {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get logs failed:', error.message);
    throw error;
  }
};

const getLogStats = async () => {
  try {
    const stats = await Log.aggregate([
      {
        $group: {
          _id: '$log_level',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = { error: 0, warn: 0, info: 0, debug: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Get log stats failed:', error.message);
    throw error;
  }
};

const getRecentLogs = async (hours = 24, limit = 50) => {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await Log.find({ timestamp: { $gte: cutoff } })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return {
      success: true,
      data: logs
    };
  } catch (error) {
    logger.error('Get recent logs failed:', error.message);
    throw error;
  }
};

const deleteOldLogs = async (days = 30) => {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Log.deleteMany({ timestamp: { $lt: cutoff } });
    
    return {
      success: true,
      data: { deletedCount: result.deletedCount }
    };
  } catch (error) {
    logger.error('Delete old logs failed:', error.message);
    throw error;
  }
};

module.exports = {
  createLog,
  getLogs,
  getLogStats,
  getRecentLogs,
  deleteOldLogs
};
