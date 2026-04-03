const { ObjectId } = require('mongodb');

class LogService {
  constructor(db) {
    this.logs = db.collection('logs');
  }

  async createLog(level, service, message, metadata = {}) {
    const log = {
      log_level: level,
      service,
      message,
      metadata,
      timestamp: new Date(),
    };
    const result = await this.logs.insertOne(log);
    return { ...log, _id: result.insertedId };
  }

  async getLogs(options = {}) {
    const { level, service, startTime, endTime, page = 1, limit = 100 } = options;
    const query = {};

    if (level) {
      query.log_level = level;
    }

    if (service) {
      query.service = service;
    }

    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) {
        query.timestamp.$gte = new Date(startTime);
      }
      if (endTime) {
        query.timestamp.$lte = new Date(endTime);
      }
    }

    const total = await this.logs.countDocuments(query);
    const skip = (page - 1) * limit;

    const cursor = this.logs.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const logs = await cursor.toArray();
    return {
      logs: logs.map(l => ({
        ...l,
        _id: l._id.toString()
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLogStats() {
    const stats = await this.logs.aggregate([
      {
        $group: {
          _id: '$log_level',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const result = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0
    };

    stats.forEach(s => {
      result[s._id] = s.count;
    });

    return result;
  }

  async getRecentLogs(hours = 24, limit = 50) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const cursor = this.logs.find({ timestamp: { $gte: cutoff } })
      .sort({ timestamp: -1 })
      .limit(limit);

    const logs = await cursor.toArray();
    return logs.map(l => ({
      ...l,
      _id: l._id.toString()
    }));
  }

  async deleteOldLogs(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.logs.deleteMany({ timestamp: { $lt: cutoff } });
    return result.deletedCount;
  }
}

module.exports = LogService;
