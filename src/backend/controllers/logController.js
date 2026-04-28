const logService = require('../services/logService');
const logger = require('../utils/logger');

const getLogs = async (req, res) => {
  try {
    const result = await logService.getLogs({
      level: req.query.level, page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50,
      startTime: req.query.start_date ? new Date(req.query.start_date) : undefined,
      endTime: req.query.end_date ? new Date(req.query.end_date) : undefined,
    });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get logs failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLogsByLevel = async (req, res) => {
  try {
    const result = await logService.getLogsByLevel(req.params.level, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50 });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get logs by level failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserLogs = async (req, res) => {
  try {
    const result = await logService.getUserLogs(req.params.userId, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 50 });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get user logs failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLogsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date, level } = req.query;
    if (!start_date || !end_date) return res.status(400).json({ success: false, error: 'Start and end dates are required' });
    const result = await logService.getLogsByDateRange(new Date(start_date), new Date(end_date), level);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get logs by date range failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLogStats = async (req, res) => {
  try {
    const result = await logService.getLogStats();
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get log stats failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSystemMonitor = async (req, res) => {
  try {
    const result = await logService.getSystemMonitor();
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get system monitor failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getLogs, getLogsByLevel, getUserLogs, getLogsByDateRange, getLogStats, getSystemMonitor };
