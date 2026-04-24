const UserMemory = require('../models/UserMemory');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');

const addEpisodicMemory = async (userId, content, sessionId) => {
  try {
    const keywords = extractKeywords(content, 5);
    
    const memory = await UserMemory.create({
      user_id: userId,
      layer: 'episodic',
      content: content.trim(),
      metadata: {
        source_session_id: sessionId || null,
        keywords,
        confidence: 0.8
      }
    });
    
    logger.info(`Episodic memory created for user ${userId}: ${memory._id}`);
    
    return {
      success: true,
      data: memory
    };
  } catch (error) {
    logger.error('Add episodic memory failed:', error.message);
    throw error;
  }
};

const addSemanticMemory = async (userId, content, keywords, embedding) => {
  try {
    const existingMemories = await UserMemory.find({
      user_id: userId,
      layer: 'semantic'
    });
    
    let shouldMerge = false;
    for (const mem of existingMemories) {
      const overlapCount = mem.metadata.keywords.filter(k => keywords.includes(k)).length;
      const maxKeywords = Math.max(mem.metadata.keywords.length, keywords.length);
      
      if (maxKeywords > 0 && overlapCount / maxKeywords > 0.6) {
        shouldMerge = true;
        break;
      }
    }
    
    if (shouldMerge) {
      logger.info(`Semantic memory merge detected for user ${userId}, skipping duplicate`);
      return { success: true, data: null, merged: true };
    }
    
    const memory = await UserMemory.create({
      user_id: userId,
      layer: 'semantic',
      content: content.trim(),
      embedding: embedding || [],
      metadata: {
        keywords,
        confidence: 0.85
      },
      tags: keywords
    });
    
    logger.info(`Semantic memory created for user ${userId}: ${memory._id}`);
    
    return {
      success: true,
      data: memory
    };
  } catch (error) {
    logger.error('Add semantic memory failed:', error.message);
    throw error;
  }
};

const addProceduralMemory = async (userId, content, keywords) => {
  try {
    const memory = await UserMemory.create({
      user_id: userId,
      layer: 'procedural',
      content: content.trim(),
      metadata: {
        keywords,
        confidence: 0.9
      },
      tags: keywords
    });
    
    logger.info(`Procedural memory created for user ${userId}: ${memory._id}`);
    
    return {
      success: true,
      data: memory
    };
  } catch (error) {
    logger.error('Add procedural memory failed:', error.message);
    throw error;
  }
};

const getEpisodicMemories = async (userId, limit = 3) => {
  try {
    const memories = await UserMemory.getByLayer(userId, 'episodic', limit);
    
    for (const mem of memories) {
      await mem.recordAccess();
    }
    
    return {
      success: true,
      data: memories
    };
  } catch (error) {
    logger.error('Get episodic memories failed:', error.message);
    throw error;
  }
};

const getSemanticMemories = async (userId, query) => {
  try {
    let memories;
    
    if (query) {
      memories = await UserMemory.searchSemantic(userId, query);
    } else {
      memories = await UserMemory.find({
        user_id: userId,
        layer: 'semantic'
      })
        .sort({ created_at: -1 })
        .limit(5);
      
      for (const mem of memories) {
        await mem.recordAccess();
      }
    }
    
    return {
      success: true,
      data: memories
    };
  } catch (error) {
    logger.error('Get semantic memories failed:', error.message);
    throw error;
  }
};

const getProceduralMemories = async (userId, limit = 10) => {
  try {
    const memories = await UserMemory.getProcedural(userId, limit);
    
    return {
      success: true,
      data: memories
    };
  } catch (error) {
    logger.error('Get procedural memories failed:', error.message);
    throw error;
  }
};

const getAllMemoriesForContext = async (userId, query) => {
  try {
    const proceduralResult = await getProceduralMemories(userId, 10);
    const semanticResult = await getSemanticMemories(userId, query);
    const episodicResult = await getEpisodicMemories(userId, 3);
    
    let systemContent = '';
    const memorySources = [];
    
    if (proceduralResult.data && proceduralResult.data.length > 0) {
      systemContent += '<user_preferences>\n';
      for (const mem of proceduralResult.data) {
        systemContent += `- ${mem.content}\n`;
        memorySources.push({ layer: 'procedural', content: mem.content });
      }
      systemContent += '</user_preferences>\n\n';
    }
    
    if (semanticResult.data && semanticResult.data.length > 0) {
      systemContent += '<known_facts>\n';
      const semanticSlice = semanticResult.data.slice(0, 5);
      for (const mem of semanticSlice) {
        systemContent += `- ${mem.content}\n`;
        memorySources.push({ layer: 'semantic', content: mem.content });
      }
      systemContent += '</known_facts>\n\n';
    }
    
    if (episodicResult.data && episodicResult.data.length > 0) {
      systemContent += '<recent_topics>\n';
      for (const mem of episodicResult.data) {
        systemContent += `- ${mem.content}\n`;
        memorySources.push({ layer: 'episodic', content: mem.content });
      }
      systemContent += '</recent_topics>\n\n';
    }
    
    return {
      success: true,
      data: {
        systemContent: systemContent.trim(),
        memorySources
      }
    };
  } catch (error) {
    logger.error('Get all memories for context failed:', error.message);
    throw error;
  }
};

const deleteMemory = async (memoryId, userId) => {
  try {
    const memory = await UserMemory.findById(memoryId);
    
    if (!memory) {
      throw new Error('Memory not found');
    }
    
    if (memory.user_id.toString() !== userId.toString()) {
      throw new Error('You can only delete your own memories');
    }
    
    await UserMemory.findByIdAndDelete(memoryId);
    
    logger.info(`Memory deleted: ${memoryId} by user ${userId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Delete memory failed:', error.message);
    throw error;
  }
};

const consolidateSemantics = async (userId) => {
  try {
    const result = await UserMemory.consolidateSemantic(userId);
    
    logger.info(`Semantic consolidation for user ${userId}: merged ${result.merged} memories`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Consolidate semantics failed:', error.message);
    throw error;
  }
};

const extractKeywords = (text, count = 5) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  const wordCount = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
};

module.exports = {
  addEpisodicMemory,
  addSemanticMemory,
  addProceduralMemory,
  getEpisodicMemories,
  getSemanticMemories,
  getProceduralMemories,
  getAllMemoriesForContext,
  deleteMemory,
  consolidateSemantics,
  extractKeywords
};
