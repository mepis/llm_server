const ChatSession = require('../models/ChatSession');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const ToolCall = require('../models/ToolCall');

const createSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { session_name, model, temperature, max_tokens, top_p, rag_enabled, rag_document_ids } = req.body;
    
    const result = await chatService.createChatSession(userId, session_name, {
      model,
      temperature,
      maxTokens: max_tokens,
      enableRAG: rag_enabled,
      ragDocuments: rag_document_ids || []
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
    
    const result = await chatService.getSessionsByUser(userId);
    
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
    const sessionId = req.params.sessionId || req.params.id;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session
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
    const sessionId = req.params.sessionId || req.params.id;
    const updateData = req.body;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    Object.assign(session, updateData);
    await session.save();
    
    res.json({
      success: true,
      data: session
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
    const sessionId = req.params.sessionId || req.params.id;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    await chatService.deleteSession(sessionId);
    
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
    const sessionId = req.params.sessionId || req.params.id;
    const { role, content, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role and content are required'
      });
    }
    
    const result = await chatService.addMessageToSession(sessionId, role, content);
    
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
    const sessionId = req.params.sessionId || req.params.id;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session.messages
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
    const sessionId = req.params.sessionId || req.params.id;
    const { message, model, temperature, max_tokens, top_p, use_rag } = req.body;

    const session = await ChatSession.findById(sessionId);

    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const result = await chatService.runLoop(sessionId, message, {
      temperature,
      max_tokens,
      top_p,
      userRoles: req.user.roles || ['user'],
    });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Send to LLM failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getToolCalls = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId || req.params.id;
    const { messageId } = req.query;

    const session = await ChatSession.findById(sessionId);

    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const result = await chatService.getToolCalls(sessionId, messageId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get tool calls failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getToolCall = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId || req.params.id;
    const toolCallId = req.params.toolCallId;

    const session = await ChatSession.findById(sessionId);

    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    const toolCall = await ToolCall.findOne({
      _id: toolCallId,
      session_id: sessionId,
    });

    if (!toolCall) {
      return res.status(404).json({
        success: false,
        error: 'Tool call not found',
      });
    }

    res.json({
      success: true,
      data: toolCall,
    });
  } catch (error) {
    logger.error('Get tool call failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const clearMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const sessionId = req.params.sessionId || req.params.id;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    await chatService.clearSessionMessages(sessionId);
    
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
    const sessionId = req.params.sessionId || req.params.id;
    const memoryData = req.body;
    
    const session = await ChatSession.findById(sessionId);
    
    if (!session || session.user_id.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const result = await chatService.updateSessionMemory(sessionId, memoryData);
    
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
  getToolCalls,
  getToolCall,
  clearMessages,
  updateMemory,
};
