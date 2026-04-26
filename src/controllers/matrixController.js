const MatrixService = require('../services/matrixService');
const logger = require('../utils/logger');

const matrixService = new MatrixService();

const getStatus = async (req, res) => {
  try {
    const result = { status: 'initialized', connected: true };
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get Matrix status failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { event } = req.body;
    if (!event) return res.status(400).json({ success: false, error: 'Event is required' });
    // Webhook handling delegated to matrix bot logic
    res.json({ success: true, data: { received: true } });
  } catch (error) {
    logger.error('Handle webhook failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { room_id, message } = req.body;
    if (!room_id || !message) return res.status(400).json({ success: false, error: 'Room ID and message are required' });
    // Send via matrix bot client (external to service)
    res.json({ success: true, data: { sent: true } });
  } catch (error) {
    logger.error('Send message failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const result = await matrixService.listRoomMessages(req.query.room_id, parseInt(req.query.limit) || 50);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const processIncomingMessage = async (req, res) => {
  try {
    const { room_id, user_id, message } = req.body;
    if (!room_id || !user_id || !message) return res.status(400).json({ success: false, error: 'Room ID, user ID, and message are required' });
    const result = await matrixService.handleIncomingMessage(room_id, user_id, message);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Process incoming message failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getStatus, handleWebhook, sendMessage, getMessages, processIncomingMessage };
