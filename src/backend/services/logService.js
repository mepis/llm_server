const { getDB } = require('../config/db');
const logger = require('../utils/logger');

const knex = () => getDB();

const jsonContains = (column, value) => ({
  jsonContains: [knex().raw(`?`, [column]), JSON.stringify(value)],
});

const createLog = async (level, service, message, metadata = {}) => {
  try {
    const id = require('uuid').v4();
    await knex().insert({
      id,
      log_level: level,
      service,
      message,
      metadata: JSON.stringify(metadata),
    }).into('logs');

    const log = await knex().from('logs').where({ id }).first();

    return { success: true, data: log };
  } catch (error) {
    logger.error('Create log failed:', error.message);
    throw error;
  }
};

const getLogs = async (options = {}) => {
  try {
    const { level, service, startTime, endTime, page = 1, limit = 100 } = options;
    let query = knex().from('logs');

    if (level) query = query.where({ log_level: level });
    if (service) query = query.where({ service });
    if (startTime || endTime) {
      const timeFilter = {};
      if (startTime) timeFilter.$gte = startTime;
      if (endTime) timeFilter.$lte = endTime;
      query = query.where('timestamp', timeFilter);
    }

    const [totalRows] = await query.clone().count('* as count').limit(1);
    const total = parseInt(totalRows.count);

    const skip = (page - 1) * limit;
    const logs = await query.orderBy('timestamp', 'desc').offset(skip).limit(limit);

    // Parse JSON columns
    const parsedLogs = logs.map(log => ({
      ...log,
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata,
    }));

    return {
      success: true,
      data: {
        logs: parsedLogs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get logs failed:', error.message);
    throw error;
  }
};

const getLogStats = async () => {
  try {
    const stats = await knex().from('logs')
      .select('log_level')
      .count('* as count')
      .groupBy('log_level');

    const result = { error: 0, warn: 0, info: 0, debug: 0 };
    stats.forEach(s => {
      result[s.log_level] = parseInt(s.count);
    });

    return { success: true, data: result };
  } catch (error) {
    logger.error('Get log stats failed:', error.message);
    throw error;
  }
};

const getRecentLogs = async (hours = 24, limit = 50) => {
  try {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await knex().from('logs')
      .where('timestamp', '>=', cutoff)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    return { success: true, data: logs };
  } catch (error) {
    logger.error('Get recent logs failed:', error.message);
    throw error;
  }
};

const deleteOldLogs = async (days = 30) => {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await knex().from('logs').where('timestamp', '<', cutoff).del();

    return { success: true, data: { deletedCount: result } };
  } catch (error) {
    logger.error('Delete old logs failed:', error.message);
    throw error;
  }
};

const getLogsByLevel = async (level, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    let query = knex().from('logs').where({ log_level: level });

    const [totalRows] = await query.clone().count('* as count').limit(1);
    const total = parseInt(totalRows.count);

    const skip = (page - 1) * limit;
    const logs = await query.orderBy('timestamp', 'desc').offset(skip).limit(limit);

    return {
      success: true,
      data: { logs, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Get logs by level failed:', error.message);
    throw error;
  }
};

const getUserLogs = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    let query = knex().from('logs').where('metadata', 'like', `%${userId}%`);

    const [totalRows] = await query.clone().count('* as count').limit(1);
    const total = parseInt(totalRows.count);

    const skip = (page - 1) * limit;
    const logs = await query.orderBy('timestamp', 'desc').offset(skip).limit(limit);

    return {
      success: true,
      data: { logs, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Get user logs failed:', error.message);
    throw error;
  }
};

const getLogsByDateRange = async (startTime, endTime, level = null, options = {}) => {
  try {
    const { page = 1, limit = 100 } = options;
    let query = knex().from('logs')
      .where('timestamp', '>=', startTime)
      .where('timestamp', '<=', endTime);

    if (level) query = query.where({ log_level: level });

    const [totalRows] = await query.clone().count('* as count').limit(1);
    const total = parseInt(totalRows.count);

    const skip = (page - 1) * limit;
    const logs = await query.orderBy('timestamp', 'desc').offset(skip).limit(limit);

    return {
      success: true,
      data: { logs, total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Get logs by date range failed:', error.message);
    throw error;
  }
};

const getSystemMonitor = async () => {
  try {
    const db = knex();
    const [logCount] = await db.from('logs').count('* as count').limit(1);
    const [recentLogs] = await db.from('logs')
      .where('timestamp', '>=', new Date(Date.now() - 3600 * 1000))
      .count('* as count')
      .limit(1);

    return {
      success: true,
      data: {
        totalLogs: parseInt(logCount.count),
        logsLastHour: parseInt(recentLogs.count),
        uptime: process.uptime(),
      },
    };
  } catch (error) {
    logger.error('Get system monitor failed:', error.message);
    throw error;
  }
};

module.exports = {
  createLog,
  getLogs,
  getLogStats,
  getRecentLogs,
  deleteOldLogs,
  getLogsByLevel,
  getUserLogs,
  getLogsByDateRange,
  getSystemMonitor,
};
