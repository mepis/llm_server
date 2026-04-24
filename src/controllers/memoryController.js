const memoryManager = require('../services/memoryManager');
const UserMemory = require('../models/UserMemory');
const ChatSession = require('../models/ChatSession');
const memoryExtractor = require('../utils/memoryExtractor');
const logger = require('../utils/logger');

const getMemories = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { layer, limit } = req.query;
    
    let result;
    if (layer === 'semantic' && req.query.q) {
      result = await memoryManager.getSemanticMemories(userId, req.query.q);
    } else if (layer === 'episodic') {
      result = await memoryManager.getEpisodicMemories(userId, parseInt(limit) || 10);
    } else if (layer === 'procedural') {
      result = await memoryManager.getProceduralMemories(userId, parseInt(limit) || 20);
    } else {
      const allResult = await Promise.all([
        memoryManager.getEpisodicMemories(userId, parseInt(limit) || 10),
        memoryManager.getSemanticMemories(userId, req.query.q),
        memoryManager.getProceduralMemories(userId, parseInt(limit) || 20)
      ]);
      
      result = {
        success: true,
        data: {
          episodic: allResult[0].data,
          semantic: allResult[1].data,
          procedural: allResult[2].data
        }
      };
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Get memories failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getEpisodic = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await memoryManager.getEpisodicMemories(userId, limit);
    
    res.json(result);
  } catch (error) {
    logger.error('Get episodic failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSemantic = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const query = req.query.q || null;
    
    const result = await memoryManager.getSemanticMemories(userId, query);
    
    res.json(result);
  } catch (error) {
    logger.error('Get semantic failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getProcedural = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await memoryManager.getProceduralMemories(userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Get procedural failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const extractMemories = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const session = await ChatSession.findById(session_id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    if (session.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only extract memories from your own sessions'
      });
    }
    
    const extracted = await memoryExtractor.extractFromConversation(session.messages);
    
    let episodicCount = 0;
    let semanticCount = 0;
    let proceduralCount = 0;
    
    for (const item of extracted.episodic) {
      if (item.confidence >= 0.5) {
        await memoryManager.addEpisodicMemory(userId, item.content, session_id);
        episodicCount++;
      }
    }
    
    for (const item of extracted.semantic) {
      if (item.confidence >= 0.5) {
        await memoryManager.addSemanticMemory(userId, item.content, item.keywords);
        semanticCount++;
      }
    }
    
    for (const item of extracted.procedural) {
      if (item.confidence >= 0.5) {
        await memoryManager.addProceduralMemory(userId, item.content, item.keywords);
        proceduralCount++;
      }
    }
    
    logger.info(`Manual memory extraction for session ${session_id}: ${episodicCount} episodic, ${semanticCount} semantic, ${proceduralCount} procedural`);
    
    res.json({
      success: true,
      data: {
        episodic_count: episodicCount,
        semantic_count: semanticCount,
        procedural_count: proceduralCount
      }
    });
  } catch (error) {
    logger.error('Extract memories failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const deleteMemory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const memoryId = req.params.id;
    
    const result = await memoryManager.deleteMemory(memoryId, userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Delete memory failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(403).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getMemories,
  getEpisodic,
  getSemantic,
  getProcedural,
  extractMemories,
  deleteMemory
};
