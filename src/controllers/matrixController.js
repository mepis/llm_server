const matrixService = require('../services/matrixService');
const logger = require('../utils/logger');

const getStatus = async (req, res) => {
  try {
    const result = await matrixService.getStatus();
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get Matrix status failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { event } = req.body;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Event is required'
      });
    }
    
    const result = await matrixService.handleWebhook(event);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Handle webhook failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { room_id, message } = req.body;
    
    if (!room_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and message are required'
      });
    }
    
    const result = await matrixService.sendMessage(room_id, message);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Send message failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { room_id, limit, from } = req.query;
    
    const result = await matrixService.getMessages(room_id, {
      limit: parseInt(limit) || 50,
      from
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const processIncomingMessage = async (req, res) => {
  try {
    const { room_id, user_id, message } = req.body;
    
    if (!room_id || !user_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Room ID, user ID, and message are required'
      });
    }
    
    const result = await matrixService.processIncomingMessage(room_id, user_id, message);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Process incoming message failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getStatus,
  handleWebhook,
  sendMessage,
  getMessages,
  processIncomingMessage
};
