const logService = require('../services/logService');
const logger = require('../utils/logger');

const getLogs = async (req, res) => {
  try {
    const { level, page, limit, start_date, end_date } = req.query;
    
    const result = await logService.getLogs({
      level,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get logs failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getLogsByLevel = async (req, res) => {
  try {
    const level = req.params.level;
    
    const result = await logService.getLogsByLevel(level);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get logs by level failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page, limit } = req.query;
    
    const result = await logService.getUserLogs(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get user logs failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getLogsByDateRange = async (req, res) => {
  try {
    const { start_date, end_date, level } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }
    
    const result = await logService.getLogsByDateRange(new Date(start_date), new Date(end_date), level);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get logs by date range failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getLogStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const result = await logService.getLogStats({
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get log stats failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSystemMonitor = async (req, res) => {
  try {
    const result = await logService.getSystemMonitor();
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get system monitor failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getLogs,
  getLogsByLevel,
  getUserLogs,
  getLogsByDateRange,
  getLogStats,
  getSystemMonitor
};
