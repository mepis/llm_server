const knex = () => require('../config/db').getDB();
const logger = require('../utils/logger');

const getHealth = async (req, res) => {
  const health = { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() };

  try {
    const db = knex();
    await db.raw('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    health.status = 'unhealthy';
    health.database = 'disconnected';
    health.database_error = error.message;
  }

  try {
    const llamaUrl = process.env.LLAMA_SERVER_URL || 'http://127.0.0.1:8082';
    const response = await fetch(`${llamaUrl}/v1/models`);
    health.llama_cpp = response.ok ? 'running' : 'unavailable';
  } catch (error) {
    health.llama_cpp = 'unavailable';
    health.llama_error = error.message;
  }

  const activeWorkers = global.workerPool?.threadCount() || 0;
  health.active_workers = activeWorkers;

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({ success: true, data: health });
};

const getPerformance = async (req, res) => {
  const performance = {
    requests_per_second: 0, average_response_time_ms: 0, error_rate: 0,
    worker_queue_length: 0, database_queries_per_second: 0, llama_inferences_per_second: 0,
  };

  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();

  performance.cpu_usage = ((cpuUsage.user + cpuUsage.system) / 1e6 / process.uptime()).toFixed(2);
  performance.memory_usage_mb = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  performance.active_workers = global.workerPool?.threadCount() || 0;

  try {
    const db = knex();
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const stats = await db('logs')
      .where('timestamp', '>=', oneMinuteAgo)
      .count('* as count')
      .andWhereRaw("log_level = 'error'")
      .first();

    // Get total count and error count separately
    const [total] = await db('logs').where('timestamp', '>=', oneMinuteAgo).count('* as count').limit(1);
    const [errors] = await db('logs').where('timestamp', '>=', oneMinuteAgo).where({ log_level: 'error' }).count('* as count').limit(1);

    if (total) {
      performance.requests_per_second = ((parseInt(total.count) || 0) / 60).toFixed(2);
      performance.error_rate = errors ? ((parseInt(errors.count) || 0) / (parseInt(total.count) || 1)).toFixed(4) : 0;
    }
  } catch (error) {
    logger.error('Failed to get performance stats:', error);
  }

  res.json({ success: true, data: performance });
};

module.exports = { getHealth, getPerformance };
