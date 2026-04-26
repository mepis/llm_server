const knex = () => require('../config/db').getDB();
const chatService = require('../services/chatService');
const logger = require('../utils/logger');

const checkSessionOwnership = async (sessionId, userId) => {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
  if (!session || session.user_id !== userId) return null;
  return session;
};

const createSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await chatService.createChatSession(userId, req.body.session_name, {
      model: req.body.model, temperature: req.body.temperature,
      maxTokens: req.body.max_tokens, enableRAG: req.body.rag_enabled,
      ragDocuments: req.body.rag_document_ids || [],
    });
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Create session failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getUserSessions = async (req, res) => {
  try {
    const result = await chatService.getSessionsByUser(req.user.user_id, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get user sessions failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    // Parse JSON columns
    const messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || []);
    const memory = typeof session.memory === 'string' ? JSON.parse(session.memory) : (session.memory || {});
    const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : (session.metadata || {});
    const ragDocumentIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);

    res.json({ success: true, data: { ...session, messages, memory, metadata, rag_document_ids: ragDocumentIds } });
  } catch (error) {
    logger.error('Get session failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const db = knex();
    const updates = {};
    if (req.body.session_name) updates.session_name = req.body.session_name;
    if (req.body.metadata !== undefined) updates.metadata = JSON.stringify(req.body.metadata);
    if (req.body.rag_enabled !== undefined) updates.rag_enabled = req.body.rag_enabled;
    if (req.body.rag_document_ids !== undefined) updates.rag_document_ids = JSON.stringify(req.body.rag_document_ids);
    updates.updated_at = new Date();

    await db('chat_sessions').where({ id: sessionId }).update(updates);
    const updated = await db('chat_sessions').where({ id: sessionId }).first();

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Update session failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    await chatService.deleteSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete session failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const addMessage = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const { role, content } = req.body;
    if (!role || !content) return res.status(400).json({ success: false, error: 'Role and content are required' });

    const result = await chatService.addMessageToSession(sessionId, role, content);
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Add message failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const result = await chatService.getMessages(sessionId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const sendToLLM = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const result = await chatService.runLoop(sessionId, req.body.message, {
      temperature: req.body.temperature, max_tokens: req.body.max_tokens,
      top_p: req.body.top_p, userRoles: req.user.roles || ['user'],
    });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Send to LLM failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const sendToLLMStream = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Session not found' })}\n\n`);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of chatService.streamRunLoop(sessionId, req.body.message, {
        temperature: req.body.temperature, max_tokens: req.body.max_tokens,
        top_p: req.body.top_p, userRoles: req.user.roles || ['user'],
      })) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (streamError) {
      logger.error('Stream error:', streamError.message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message })}\n\n`);
    }
    res.end();
  } catch (error) {
    logger.error('Send to LLM stream failed:', error.message);
    try { res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`); } catch (_) {}
    res.end();
  }
};

const getToolCalls = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const result = await chatService.getToolCalls(sessionId, req.query.messageId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get tool calls failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getToolCall = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const toolCall = await knex().from('tool_calls').where({ id: req.params.toolCallId, session_id: sessionId }).first();
    if (!toolCall) return res.status(404).json({ success: false, error: 'Tool call not found' });

    res.json({ success: true, data: toolCall });
  } catch (error) {
    logger.error('Get tool call failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const clearMessages = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    await chatService.clearSessionMessages(sessionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Clear messages failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const updateMemory = async (req, res) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const session = await checkSessionOwnership(sessionId, req.user.user_id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    const result = await chatService.updateSessionMemory(sessionId, req.body);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Update memory failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

module.exports = { createSession, getUserSessions, getSession, updateSession, deleteSession, addMessage, getMessages, sendToLLM, sendToLLMStream, getToolCalls, getToolCall, clearMessages, updateMemory };
