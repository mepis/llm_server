const chatService = require('../services/chatService');
const logger = require('../utils/logger');

const createSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { session_name, model, temperature, max_tokens, top_p, rag_enabled, rag_document_ids } = req.body;
    
    const result = await chatService.createSession(userId, {
      session_name,
      model,
      temperature,
      max_tokens,
      top_p,
      rag_enabled,
      rag_document_ids
    });
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create session failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await chatService.getUserSessions(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get user sessions failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    
    const result = await chatService.getSession(sessionId, userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get session failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    const updateData = req.body;
    
    const result = await chatService.updateSession(sessionId, userId, updateData);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update session failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    
    await chatService.deleteSession(sessionId, userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete session failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const addMessage = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    const { role, content, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role and content are required'
      });
    }
    
    const result = await chatService.addMessage(sessionId, userId, role, content, metadata);
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Add message failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    
    const result = await chatService.getMessages(sessionId, userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const sendToLLM = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    const { message, model, temperature, max_tokens, top_p, use_rag } = req.body;
    
    const result = await chatService.sendToLLM(sessionId, userId, message, {
      model,
      temperature,
      max_tokens,
      top_p,
      use_rag
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Send to LLM failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const clearMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    
    await chatService.clearMessages(sessionId, userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Clear messages failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateMemory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId;
    const memoryData = req.body;
    
    const result = await chatService.updateMemory(sessionId, userId, memoryData);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update memory failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createSession,
  getUserSessions,
  getSession,
  updateSession,
  deleteSession,
  addMessage,
  getMessages,
  sendToLLM,
  clearMessages,
  updateMemory
};
