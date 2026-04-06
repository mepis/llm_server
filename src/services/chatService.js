const ChatSession = require('../models/ChatSession');
const RAGDocument = require('../models/RAGDocument');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');

const createChatSession = async (userId, sessionName, options = {}) => {
  try {
    const { 
      model = 'llama-3-8b',
      temperature = 0.7,
      maxTokens = 2048,
      enableRAG = false,
      ragDocuments = []
    } = options;
    
    const session = await ChatSession.create({
      user_id: userId,
      session_name: sessionName,
      metadata: {
        model,
        temperature,
        max_tokens: maxTokens
      },
      rag_enabled: enableRAG,
      rag_document_ids: ragDocuments
    });
    
    logger.info(`Chat session created: ${session._id} for user ${userId}`);
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    logger.error('Create chat session failed:', error.message);
    throw error;
  }
};

const addMessageToSession = async (sessionId, role, content) => {
  try {
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.addMessage(role, content);
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    logger.error('Add message failed:', error.message);
    throw error;
  }
};

const getMessages = async (sessionId) => {
  try {
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      success: true,
      data: session.messages
    };
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    throw error;
  }
};

const chatWithLLM = async (sessionId, content, options = {}) => {
  try {
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    const { temperature, max_tokens, top_p, stream } = {
      temperature: session.metadata?.temperature || 0.7,
      max_tokens: session.metadata?.max_tokens || 2048,
      top_p: session.metadata?.top_p || 0.9,
      ...options
    };
    
    const messages = session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    messages.push({
      role: 'user',
      content
    });
    
    let responseContent;
    
    if (stream) {
      responseContent = await streamChatResponse(sessionId, messages, {
        temperature,
        max_tokens,
        top_p
      });
    } else {
      const response = await llamaService.getChatCompletions(messages, {
        temperature,
        max_tokens,
        top_p,
        stream: false
      });
      
      responseContent = response.choices[0]?.message?.content || '';
    }
    
    await session.addMessage('assistant', responseContent, {
      model: session.metadata?.model || 'llama-3-8b'
    });
    
    return {
      success: true,
      data: responseContent,
      session: session
    };
  } catch (error) {
    logger.error('Chat with LLM failed:', error.message);
    throw error;
  }
};

const streamChatResponse = async function*(sessionId, messages, options) {
  const session = await ChatSession.findById(sessionId);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await llamaService.getChatCompletions(messages, {
      ...options,
      stream: true
    });
    
    let fullResponse = '';
    let buffer = '';
    
    for await (const chunk of response) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      buffer += chunkText;
      
      if (buffer.length > 100) {
        fullResponse += buffer;
        buffer = '';
      }
      
      yield chunkText;
    }
    
    fullResponse += buffer;
    
    clearTimeout(timeoutId);
    
    await session.addMessage('assistant', fullResponse, {
      model: session.metadata?.model || 'llama-3-8b'
    });
    
  } catch (error) {
    logger.error('Streaming chat error:', error.message);
    throw error;
  }
};

const clearSessionMessages = async (sessionId) => {
  try {
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.clearMessages();
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    logger.error('Clear messages failed:', error.message);
    throw error;
  }
};

const updateSessionMemory = async (sessionId, memoryData) => {
  try {
    const session = await ChatSession.findById(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    await session.updateMemory(memoryData);
    
    return {
      success: true,
      data: session
    };
  } catch (error) {
    logger.error('Update session memory failed:', error.message);
    throw error;
  }
};

const getSessionsByUser = async (userId) => {
  try {
    const sessions = await ChatSession.find({ user_id: userId })
      .sort({ created_at: -1 })
      .select('-messages');
    
    return {
      success: true,
      data: sessions
    };
  } catch (error) {
    logger.error('Get user sessions failed:', error.message);
    throw error;
  }
};

const deleteSession = async (sessionId) => {
  try {
    const session = await ChatSession.findByIdAndDelete(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    logger.info(`Session deleted: ${sessionId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Delete session failed:', error.message);
    throw error;
  }
};

module.exports = {
  createChatSession,
  addMessageToSession,
  getMessages,
  chatWithLLM,
  streamChatResponse,
  clearSessionMessages,
  updateSessionMemory,
  getSessionsByUser,
  deleteSession
};
