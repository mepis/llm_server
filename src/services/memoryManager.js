const { getDB } = require('../config/db');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');

const knex = () => getDB();

const addEpisodicMemory = async (userId, content, sessionId) => {
  try {
    const keywords = extractKeywords(content, 5);
    const id = require('uuid').v4();

    await knex().insert({
      id,
      user_id: userId,
      layer: 'episodic',
      content: content.trim(),
      metadata: JSON.stringify({
        source_session_id: sessionId || null,
        keywords,
        confidence: 0.8,
        extracted_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
      tags: JSON.stringify(keywords),
    }).into('user_memories');

    const memory = await knex().from('user_memories').where({ id }).first();

    logger.info(`Episodic memory created for user ${userId}: ${memory.id}`);

    return { success: true, data: memory };
  } catch (error) {
    logger.error('Add episodic memory failed:', error.message);
    throw error;
  }
};

const addSemanticMemory = async (userId, content, keywords, embedding) => {
  try {
    const existingMemories = await knex().from('user_memories')
      .where({ user_id: userId, layer: 'semantic' });

    let shouldMerge = false;
    for (const mem of existingMemories) {
      const meta = typeof mem.metadata === 'string' ? JSON.parse(mem.metadata) : (mem.metadata || {});
      const memKeywords = meta.keywords || [];
      const overlapCount = memKeywords.filter(k => keywords.includes(k)).length;
      const maxKeywords = Math.max(memKeywords.length, keywords.length);

      if (maxKeywords > 0 && overlapCount / maxKeywords > 0.6) {
        shouldMerge = true;
        break;
      }
    }

    if (shouldMerge) {
      logger.info(`Semantic memory merge detected for user ${userId}, skipping duplicate`);
      return { success: true, data: null, merged: true };
    }

    const id = require('uuid').v4();
    await knex().insert({
      id,
      user_id: userId,
      layer: 'semantic',
      content: content.trim(),
      embedding: JSON.stringify(embedding || []),
      metadata: JSON.stringify({ keywords, confidence: 0.85, extracted_at: new Date() }),
      tags: JSON.stringify(keywords),
    }).into('user_memories');

    const memory = await knex().from('user_memories').where({ id }).first();

    logger.info(`Semantic memory created for user ${userId}: ${memory.id}`);

    return { success: true, data: memory };
  } catch (error) {
    logger.error('Add semantic memory failed:', error.message);
    throw error;
  }
};

const addProceduralMemory = async (userId, content, keywords) => {
  try {
    const id = require('uuid').v4();
    await knex().insert({
      id,
      user_id: userId,
      layer: 'procedural',
      content: content.trim(),
      metadata: JSON.stringify({ keywords, confidence: 0.9, extracted_at: new Date() }),
      tags: JSON.stringify(keywords),
    }).into('user_memories');

    const memory = await knex().from('user_memories').where({ id }).first();

    logger.info(`Procedural memory created for user ${userId}: ${memory.id}`);

    return { success: true, data: memory };
  } catch (error) {
    logger.error('Add procedural memory failed:', error.message);
    throw error;
  }
};

const getByLayer = async (userId, layer, limit) => {
  const memories = await knex().from('user_memories')
    .where({ user_id: userId, layer })
    .orderBy('created_at', 'desc')
    .limit(limit);

  return memories;
};

const searchSemantic = async (userId, query) => {
  // Use fulltext search on content column
  const memories = await knex().from('user_memories')
    .where({ user_id: userId, layer: 'semantic' })
    .whereRaw('MATCH(content) AGAINST(? IN BOOLEAN MODE)', [query])
    .orderBy('created_at', 'desc')
    .limit(5);

  return memories;
};

const getProcedural = async (userId, limit) => {
  return knex().from('user_memories')
    .where({ user_id: userId, layer: 'procedural' })
    .orderBy('created_at', 'desc')
    .limit(limit);
};

const getEpisodicMemories = async (userId, limit = 3) => {
  try {
    const memories = await getByLayer(userId, 'episodic', limit);

    // Update access count for each
    for (const mem of memories) {
      await recordAccess(mem.id);
    }

    return { success: true, data: memories };
  } catch (error) {
    logger.error('Get episodic memories failed:', error.message);
    throw error;
  }
};

const getSemanticMemories = async (userId, query) => {
  try {
    let memories;

    if (query) {
      memories = await searchSemantic(userId, query);
    } else {
      memories = await knex().from('user_memories')
        .where({ user_id: userId, layer: 'semantic' })
        .orderBy('created_at', 'desc')
        .limit(5);

      for (const mem of memories) {
        await recordAccess(mem.id);
      }
    }

    return { success: true, data: memories };
  } catch (error) {
    logger.error('Get semantic memories failed:', error.message);
    throw error;
  }
};

const getProceduralMemories = async (userId, limit = 10) => {
  try {
    const memories = await getProcedural(userId, limit);
    return { success: true, data: memories };
  } catch (error) {
    logger.error('Get procedural memories failed:', error.message);
    throw error;
  }
};

const recordAccess = async (memoryId) => {
  const memory = await knex().from('user_memories').where({ id: memoryId }).first();
  if (!memory) return;

  let metadata = typeof memory.metadata === 'string' ? JSON.parse(memory.metadata) : (memory.metadata || {});
  metadata.last_accessed = new Date();
  metadata.access_count = (metadata.access_count || 0) + 1;

  await knex().from('user_memories')
    .where({ id: memoryId })
    .update({ metadata: JSON.stringify(metadata) });
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
        memorySources,
      },
    };
  } catch (error) {
    logger.error('Get all memories for context failed:', error.message);
    throw error;
  }
};

const deleteMemory = async (memoryId, userId) => {
  try {
    const memory = await knex().from('user_memories').where({ id: memoryId }).first();

    if (!memory) {
      throw new Error('Memory not found');
    }

    if (memory.user_id !== userId) {
      throw new Error('You can only delete your own memories');
    }

    await knex().from('user_memories').where({ id: memoryId }).del();

    logger.info(`Memory deleted: ${memoryId} by user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete memory failed:', error.message);
    throw error;
  }
};

const consolidateSemantic = async (userId) => {
  try {
    const memories = await knex().from('user_memories')
      .where({ user_id: userId, layer: 'semantic' });

    const toDelete = [];
    for (let i = 0; i < memories.length; i++) {
      const metaA = typeof memories[i].metadata === 'string' ? JSON.parse(memories[i].metadata) : (memories[i].metadata || {});
      const keywordsA = metaA.keywords || [];

      for (let j = i + 1; j < memories.length; j++) {
        if (toDelete.includes(memories[j].id)) continue;

        const metaB = typeof memories[j].metadata === 'string' ? JSON.parse(memories[j].metadata) : (memories[j].metadata || {});
        const keywordsB = metaB.keywords || [];

        const overlapCount = keywordsA.filter(k => keywordsB.includes(k)).length;
        const maxKeywords = Math.max(keywordsA.length, keywordsB.length);

        if (maxKeywords > 0 && overlapCount / maxKeywords > 0.6) {
          toDelete.push(memories[j].id);
        }
      }
    }

    if (toDelete.length > 0) {
      await knex().from('user_memories').whereIn('id', toDelete).del();
    }

    return { success: true, data: { merged: toDelete.length } };
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
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
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
  consolidateSemantics: consolidateSemantic,
  extractKeywords,
};
