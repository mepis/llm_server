const { getDB } = require('../config/db');
const logger = require('../utils/logger');

const knex = () => getDB();

// Helper: add message to chat_messages table (primary) and session JSON (backward compat)
const addMessageToSessionJSON = async (sessionId, role, content, metadata = {}) => {
  const msgData = {
    id: require('uuid').v4(),
    session_id: sessionId,
    role,
    content: content || '',
    metadata: metadata ? JSON.stringify(metadata) : '{}',
    tool_calls: metadata && metadata.tool_calls ? JSON.stringify(metadata.tool_calls) : null,
    tool_call_id: metadata && metadata.tool_call_id ? metadata.tool_call_id : null,
    model: metadata && metadata.model ? metadata.model : null,
    citations: metadata && metadata.citations ? JSON.stringify(metadata.citations) : null,
    created_at: new Date(),
  };

  await knex().transaction(async (trx) => {
    await trx('chat_messages').insert(msgData);

    const session = await trx('chat_sessions').where({ id: sessionId }).select('messages').first();
    if (!session) throw new Error('Session not found');

    let messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || []);
    messages.push({
      role,
      content: content || '',
      timestamp: new Date(),
      metadata: metadata || {},
      tool_calls: metadata && metadata.tool_calls ? metadata.tool_calls : undefined,
      tool_call_id: metadata && metadata.tool_call_id ? metadata.tool_call_id : undefined,
    });

    await trx('chat_sessions')
      .where({ id: sessionId })
      .update({
        messages: JSON.stringify(messages),
        updated_at: new Date(),
      });
  });
};

// Helper: clear session messages
const clearSessionMessagesJSON = async (sessionId) => {
  await knex().transaction(async (trx) => {
    await trx('chat_messages').where({ session_id: sessionId }).del();
    await trx('chat_sessions')
      .where({ id: sessionId })
      .update({ messages: JSON.stringify([]), updated_at: new Date() });
  });
};

// Helper: update session memory
const updateSessionMemoryJSON = async (sessionId, memoryData) => {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).select('memory').first();
  if (!session) throw new Error('Session not found');

  let currentMemory = typeof session.memory === 'string' ? JSON.parse(session.memory) : (session.memory || {});
  const newMemory = { ...currentMemory, ...memoryData };

  await knex().from('chat_sessions')
    .where({ id: sessionId })
    .update({ memory: JSON.stringify(newMemory) });
};

// Helper: add rag document to session
const addRagDocumentToSessionJSON = async (sessionId, documentId) => {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).select('rag_document_ids').first();
  if (!session) throw new Error('Session not found');

  let docIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);
  if (!docIds.includes(documentId)) {
    docIds.push(documentId);
    await knex().from('chat_sessions')
      .where({ id: sessionId })
      .update({ rag_document_ids: JSON.stringify(docIds) });
  }
};

// Helper: remove rag document from session
const removeRagDocumentFromSessionJSON = async (sessionId, documentId) => {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).select('rag_document_ids').first();
  if (!session) throw new Error('Session not found');

  let docIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);
  docIds = docIds.filter(id => id !== documentId);
  await knex().from('chat_sessions')
    .where({ id: sessionId })
    .update({ rag_document_ids: JSON.stringify(docIds) });
};

const MEMORY_EXTRACTION_THRESHOLD = parseInt(process.env.MEMORY_EXTRACTION_THRESHOLD) || 10;

async function buildUserMemoryContext(userId, query) {
  try {
    const memoryManager = require('./memoryManager');
    const result = await memoryManager.getAllMemoriesForContext(userId, query);

    if (result.success && result.data.systemContent) {
      return {
        memoryContext: `\n\n${result.data.systemContent}`,
        memorySources: result.data.memorySources || [],
      };
    }

    return { memoryContext: '', memorySources: [] };
  } catch (error) {
    logger.error('Build user memory context failed:', error.message);
    return { memoryContext: '', memorySources: [] };
  }
}

async function triggerAutomaticMemoryExtraction(session, userId) {
  try {
    const msgs = Array.isArray(session.messages) ? session.messages : [];
    if (msgs.length < MEMORY_EXTRACTION_THRESHOLD) return;

    try {
      const filteredMessages = msgs.filter(
        m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0
      );

      if (filteredMessages.length < 2) return;

      const memoryExtractor = require('../utils/memoryExtractor');
      const memoryManager = require('./memoryManager');
      const extracted = await memoryExtractor.extractFromConversation(filteredMessages);

      for (const episodic of extracted.episodic) {
        if (episodic.confidence >= 0.5) {
          await memoryManager.addEpisodicMemory(userId, episodic.content, session.id);
        }
      }

      for (const semantic of extracted.semantic) {
        if (semantic.confidence >= 0.5) {
          await memoryManager.addSemanticMemory(userId, semantic.content, semantic.keywords);
        }
      }

      for (const procedural of extracted.procedural) {
        if (procedural.confidence >= 0.5) {
          await memoryManager.addProceduralMemory(userId, procedural.content, procedural.keywords);
        }
      }

      logger.info(`Auto memory extraction for session ${session.id}: ${extracted.episodic.length} episodic, ${extracted.semantic.length} semantic, ${extracted.procedural.length} procedural`);
    } catch (extractError) {
      logger.error(`Memory extraction failed for session ${session.id}:`, extractError.message);
    }
  } catch (error) {
    logger.error('Trigger automatic memory extraction failed:', error.message);
  }
}

async function getMaxToolTurns() {
  try {
    const config = await knex().from('configs').where({ key: 'MAX_TOOL_TURNS' }).first();
    if (config) {
      return parseInt(config.value) || 10;
    }
  } catch (error) {
    logger.error('Failed to get MAX_TOOL_TURNS from config:', error.message);
  }
  return 10;
}

async function buildSkillsPrompt(userRoles) {
  try {
    const skillService = require('./skillService');
    const result = await skillService.getAccessibleSkills(userRoles);
    const skills = result.data;

    if (skills.length === 0) return null;

    const skillEntries = skills
      .map(skill => `  <skill>\n    <name>${skill.name}</name>\n    <description>${skill.description}</description>\n    <location>${skill.location}</location>\n  </skill>`)
      .join('\n');

    return [
      'Skills provide specialized instructions and workflows for specific tasks.',
      'Use the skill tool to load a skill when a task matches its description.',
      'The skill will inject detailed instructions, workflows, and access to bundled resources into the conversation context.',
      '',
      '<available_skills>',
      skillEntries,
      '</available_skills>',
    ].join('\n');
  } catch (error) {
    logger.error('Build skills prompt failed:', error.message);
    return null;
  }
}

async function resolveTools(session) {
  const { getBuiltinTools } = require('../tool');
  const toolRegistry = require('../tool/registry');
  const builtinTools = getBuiltinTools();
  const customTools = await toolRegistry.loadCustomTools(session.metadata?.model);
  const allTools = [...builtinTools, ...customTools];
  const openAITools = toolRegistry.toOpenAITools(allTools);
  return { tools: allTools, openAITools };
}

function truncateMessages(messages, maxMessages = 20) {
  if (messages.length <= maxMessages) return messages;
  const systemMsg = messages.find(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');
  if (nonSystem.length <= maxMessages) return messages;
  const recent = nonSystem.slice(-(maxMessages - 1));
  return systemMsg ? [systemMsg, ...recent] : recent;
}

function buildMessages(session) {
  const msgs = Array.isArray(session.messages) ? session.messages : [];
  return msgs.map((msg) => {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      return { role: 'assistant', content: null, tool_calls: msg.tool_calls };
    }
    if (msg.role === 'tool' && msg.tool_call_id) {
      return { role: 'tool', tool_call_id: msg.tool_call_id, content: msg.content || '' };
    }
    return { role: msg.role, content: msg.content || '' };
  });
}

const createChatSession = async (userId, sessionName, options = {}) => {
  try {
    const { model = 'llama-3-8b', temperature = 0.7, maxTokens = 2048, enableRAG = false, ragDocuments = [] } = options;
    const id = require('uuid').v4();

    await knex().insert({
      id,
      user_id: userId,
      session_name: sessionName,
      messages: JSON.stringify([]),
      memory: JSON.stringify({ conversation_summary: '', key_points: [], entities: [], preferences: {} }),
      metadata: JSON.stringify({ model, temperature, max_tokens: maxTokens, top_p: 0.9 }),
      rag_enabled: enableRAG,
      rag_document_ids: JSON.stringify(ragDocuments),
    }).into('chat_sessions');

    const session = await knex().from('chat_sessions').where({ id }).first();

    // Parse JSON columns to match frontend expectations
    const messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || []);
    const memory = typeof session.memory === 'string' ? JSON.parse(session.memory) : (session.memory || {});
    const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : (session.metadata || {});
    const ragDocumentIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);

    logger.info(`Chat session created: ${session.id} for user ${userId}`);

    return { success: true, data: { ...session, chat_id: session.id, messages, memory, metadata, rag_document_ids: ragDocumentIds } };
  } catch (error) {
    logger.error('Create chat session failed:', error.message);
    throw error;
  }
};

const addMessageToSession = async (sessionId, role, content) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    await addMessageToSessionJSON(sessionId, role, content);

    const updatedSession = await knex().from('chat_sessions').where({ id: sessionId }).first();

    return { success: true, data: { ...updatedSession, chat_id: updatedSession.id } };
  } catch (error) {
    logger.error('Add message failed:', error.message);
    throw error;
  }
};

const getMessages = async (sessionId) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    const dbMessages = await knex('chat_messages')
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc');

    if (dbMessages.length > 0) {
      const messages = dbMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at,
        metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {}),
        tool_calls: msg.tool_calls ? (typeof msg.tool_calls === 'string' ? JSON.parse(msg.tool_calls) : msg.tool_calls) : undefined,
        tool_call_id: msg.tool_call_id || undefined,
      }));
      return { success: true, data: messages };
    }

    const messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || []);

    return { success: true, data: messages };
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    throw error;
  }
};

const executeToolCall = async (toolCall, session, allTools) => {
  const toolName = toolCall.function?.name || toolCall.tool_name;
  const toolCallId = toolCall.id || toolCall.tool_call_id;
  const input = toolCall.function?.arguments
    ? JSON.parse(toolCall.function.arguments)
    : toolCall.input || {};

  const id = require('uuid').v4();
  await knex().insert({
    id,
    session_id: session.id,
    message_id: toolCallId,
    tool_call_id: toolCallId,
    tool_name: toolName,
    input: typeof input === 'object' ? JSON.stringify(input) : JSON.stringify({}),
    state: 'running',
  }).into('tool_calls');

  const tool = allTools.find((t) => t.id === toolName);

  if (!tool) {
    await knex().from('tool_calls').where({ id }).update({
      state: 'error',
      output: `Unknown tool: ${toolName}`,
      error: `Unknown tool: ${toolName}`,
    });
    return { role: 'tool', tool_call_id: toolCallId, content: `Error: Unknown tool "${toolName}"` };
  }

  const ctx = {
    sessionID: session.id,
    messageID: toolCallId,
    agent: 'assistant',
    abort: new AbortController().signal,
    messages: Array.isArray(session.messages) ? session.messages : [],
    metadata: async (val) => {},
    ask: async (req) => {
      await knex().from('tool_calls').where({ id }).update({
        state: 'pending',
        output: `Question: ${req.question}`,
      });
    },
  };

  try {
    const result = await tool.execute(input, ctx);
    const output = result.output || '';

    await knex().from('tool_calls').where({ id }).update({
      state: 'completed',
      output,
      title: result.title,
      metadata: typeof result.metadata === 'object' ? JSON.stringify(result.metadata) : {},
    });

    return { role: 'tool', tool_call_id: toolCallId, content: output };
  } catch (error) {
    await knex().from('tool_calls').where({ id }).update({
      state: 'error',
      output: `Error: ${error.message}`,
      error: error.message,
    });

    return { role: 'tool', tool_call_id: toolCallId, content: `Error executing tool "${toolName}": ${error.message}` };
  }
};

const chatWithLLM = async (sessionId, content, options = {}) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : (session.metadata || {});
    const ragDocumentIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);

    const { temperature, max_tokens, top_p } = {
      temperature: metadata?.temperature || 0.7,
      max_tokens: metadata?.max_tokens || 2048,
      top_p: metadata?.top_p || 0.9,
      ...options,
    };

    await addMessageToSessionJSON(sessionId, 'user', content);

    const messages = buildMessages(session);
    const { tools, openAITools } = await resolveTools(session);

    let ragContext = '';
    let ragCitations = [];
    if (session.rag_enabled && ragDocumentIds.length > 0) {
      const ragService = require('./ragService');
      const ragResult = await ragService.searchDocuments(
        session.user_id, content, 5, ragDocumentIds
      );
      if (ragResult && ragResult.data && ragResult.data.results && ragResult.data.results.length > 0) {
        ragContext = ragResult.data.results.map(r => r.text).join('\n\n');

        const citationBuilder = require('../utils/citationBuilder');
        const citationData = citationBuilder.buildCitations(ragResult.data);
        ragCitations = citationData.citations;
      }
    }

    const userRoles = options.userRoles || ['user'];
    const skillsPrompt = await buildSkillsPrompt(userRoles);

    let systemMessage = 'You are a helpful assistant.';
    if (ragContext) {
      systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers. Cite your sources using bracketed numbers [1], [2] etc.`;
    }
    if (skillsPrompt) {
      systemMessage = skillsPrompt + '\n\n' + systemMessage;
    }

    const truncatedMessages = truncateMessages(messages);
    const finalMessages = [{ role: 'system', content: systemMessage }, ...truncatedMessages];

    const llamaService = require('./llamaService');
    const response = await llamaService.chatWithTools(finalMessages, openAITools, { temperature, max_tokens, top_p });

    const assistantMessage = response.choices?.[0]?.message || {};
    const contentText = assistantMessage.content || '';
    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls && toolCalls.length > 0) {
      await addMessageToSessionJSON(sessionId, 'assistant', null, {
        tool_calls: toolCalls,
        model: metadata?.model || 'llama-3-8b',
        citations: ragCitations.map(c => ({
          source_id: c.source.document_id, filename: c.source.filename,
          chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
        })),
      });

      const toolResults = [];
      for (const tc of toolCalls) {
        const result = await executeToolCall(tc, session, tools);
        toolResults.push(result);
      }

      return { success: true, data: { content: null, tool_calls: toolCalls, tool_results: toolResults }, session, needsMoreTurns: true };
    }

    await addMessageToSessionJSON(sessionId, 'assistant', contentText, {
      model: metadata?.model || 'llama-3-8b',
      citations: ragCitations.map(c => ({
        source_id: c.source.document_id, filename: c.source.filename,
        chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
      })),
    });

    return { success: true, data: contentText, session, needsMoreTurns: false };
  } catch (error) {
    logger.error('Chat with LLM failed:', error.message);
    throw error;
  }
};

const runLoop = async (sessionId, content, options = {}) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : (session.metadata || {});
    const ragDocumentIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);

    const { temperature, max_tokens, top_p } = {
      temperature: metadata?.temperature || 0.7,
      max_tokens: metadata?.max_tokens || 2048,
      top_p: metadata?.top_p || 0.9,
      ...options,
    };

    await addMessageToSessionJSON(sessionId, 'user', content);

    const messages = buildMessages(session);
    const { tools, openAITools } = await resolveTools(session);

    let ragContext = '';
    let ragCitations = [];
    if (session.rag_enabled && ragDocumentIds.length > 0) {
      const ragService = require('./ragService');
      const ragResult = await ragService.searchDocuments(
        session.user_id, content, 5, ragDocumentIds
      );
      if (ragResult && ragResult.data && ragResult.data.results && ragResult.data.results.length > 0) {
        ragContext = ragResult.data.results.map(r => r.text).join('\n\n');

        const citationBuilder = require('../utils/citationBuilder');
        const citationData = citationBuilder.buildCitations(ragResult.data);
        ragCitations = citationData.citations;
      }
    }

    const memoryContext = await buildUserMemoryContext(session.user_id, content);
    const userRoles = options.userRoles || ['user'];
    const skillsPrompt = await buildSkillsPrompt(userRoles);

    let systemMessage = 'You are a helpful assistant.';
    if (memoryContext.memoryContext) systemMessage += memoryContext.memoryContext;
    if (ragContext) systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers. Cite your sources using bracketed numbers [1], [2] etc.`;
    if (skillsPrompt) systemMessage = skillsPrompt + '\n\n' + systemMessage;

    let turn = 0;
    const maxTurns = await getMaxToolTurns();
    let finalContent = '';

    while (turn < maxTurns) {
      const truncatedMessages = truncateMessages(messages);
      const finalMessages = [{ role: 'system', content: systemMessage }, ...truncatedMessages];

      const llamaService = require('./llamaService');
      const response = await llamaService.chatWithTools(finalMessages, openAITools, { temperature, max_tokens, top_p });

      const assistantMessage = response.choices?.[0]?.message || {};
      const contentText = assistantMessage.content || '';
      const toolCalls = assistantMessage.tool_calls || [];

      if (toolCalls && toolCalls.length > 0) {
        await addMessageToSessionJSON(sessionId, 'assistant', null, {
          tool_calls: toolCalls,
          model: metadata?.model || 'llama-3-8b',
          citations: ragCitations.map(c => ({
            source_id: c.source.document_id, filename: c.source.filename,
            chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
          })),
        });

        for (const tc of toolCalls) {
          const result = await executeToolCall(tc, session, tools);
          messages.push(result);
          await addMessageToSessionJSON(sessionId, 'tool', result.content, { tool_call_id: result.tool_call_id });
        }

        turn++;
        continue;
      }

      await addMessageToSessionJSON(sessionId, 'assistant', contentText, {
        model: metadata?.model || 'llama-3-8b',
        citations: ragCitations.map(c => ({
          source_id: c.source.document_id, filename: c.source.filename,
          chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
        })),
      });

      finalContent = contentText;
      break;
    }

    if (turn >= maxTurns) {
      logger.warn(`Max tool turns (${maxTurns}) exceeded for session ${sessionId}`);
      if (!finalContent) {
        finalContent = `Response truncated: exceeded maximum tool turns (${maxTurns}). The assistant may be stuck in a loop.`;
      }
    }

    if (session.session_name === 'New Chat') {
      try {
        const msgs = Array.isArray(session.messages) ? session.messages : [];
        const subject = await generateSessionSubject(msgs);
        if (subject && subject.trim()) {
          await knex().from('chat_sessions').where({ id: sessionId }).update({ session_name: subject.trim() });
          logger.info(`Auto-generated subject for session ${sessionId}: "${subject}"`);
        }
      } catch (err) {
        logger.error('Failed to generate/update session subject:', err.message);
      }
    }

    try {
      await triggerAutomaticMemoryExtraction(session, session.user_id);
    } catch (memErr) {
      logger.error('Memory extraction after runLoop failed:', memErr.message);
    }

    return { success: true, data: finalContent, session };
  } catch (error) {
    logger.error('Run loop failed:', error.message);
    throw error;
  }
};

async function* streamChatResponse(sessionId, messages, options) {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).first();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const llamaService = require('./llamaService');
    const response = await llamaService.getChatCompletions(messages, { ...options, stream: true });

    let fullResponse = '';
    let buffer = '';

    for await (const chunk of response) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      buffer += chunkText;
      if (buffer.length > 100) { fullResponse += buffer; buffer = ''; }
      yield chunkText;
    }

    fullResponse += buffer;
    clearTimeout(timeoutId);

    await addMessageToSessionJSON(sessionId, 'assistant', fullResponse, {
      model: typeof session.metadata === 'string' ? JSON.parse(session.metadata)?.model || 'llama-3-8b' : (session.metadata?.model || 'llama-3-8b'),
    });
  } catch (error) {
    logger.error('Streaming chat error:', error.message);
    throw error;
  }
}

async function* streamRunLoop(sessionId, content, options = {}) {
  const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
  if (!session) { yield { type: 'error', message: 'Session not found' }; return; }

  const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : (session.metadata || {});
  const ragDocumentIds = typeof session.rag_document_ids === 'string' ? JSON.parse(session.rag_document_ids) : (session.rag_document_ids || []);

  const { temperature, max_tokens, top_p } = {
    temperature: metadata?.temperature || 0.7,
    max_tokens: metadata?.max_tokens || 2048,
    top_p: metadata?.top_p || 0.9,
    ...options,
  };

  await addMessageToSessionJSON(sessionId, 'user', content);
  const messages = buildMessages(session);
  const { tools, openAITools } = await resolveTools(session);

  let ragContext = '';
  let ragCitations = [];
  if (session.rag_enabled && ragDocumentIds.length > 0) {
    const ragService = require('./ragService');
    const ragResult = await ragService.searchDocuments(
      session.user_id, content, 5, ragDocumentIds
    );
    if (ragResult && ragResult.data && ragResult.data.results && ragResult.data.results.length > 0) {
      ragContext = ragResult.data.results.map(r => r.text).join('\n\n');
      const citationBuilder = require('../utils/citationBuilder');
      const citationData = citationBuilder.buildCitations(ragResult.data);
      ragCitations = citationData.citations;
    }
  }

  const memoryContext = await buildUserMemoryContext(session.user_id, content);
  const userRoles = options.userRoles || ['user'];
  const skillsPrompt = await buildSkillsPrompt(userRoles);

  let systemMessage = 'You are a helpful assistant.';
  if (memoryContext.memoryContext) systemMessage += memoryContext.memoryContext;
  if (ragContext) systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers. Cite your sources using bracketed numbers [1], [2] etc.`;
  if (skillsPrompt) systemMessage = skillsPrompt + '\n\n' + systemMessage;

  let turn = 0;
  const maxTurns = await getMaxToolTurns();
  let fullFinalContent = '';

  yield { type: 'turn_start', turn, maxTurns };

  while (turn < maxTurns) {
    const truncatedMessages = truncateMessages(messages);
    const finalMessages = [{ role: 'system', content: systemMessage }, ...truncatedMessages];
    let turnContent = '';
    const accumulatedToolCalls = {};
    let lastCreatedToolCallIdx = -1;
    let hasStopReason = false;

    try {
      const llamaService = require('./llamaService');
      for await (const chunk of llamaService.streamChatWithTools(finalMessages, openAITools, { temperature, max_tokens, top_p })) {
        const choice = chunk.choices?.[0];
        if (!choice?.delta) continue;

        if (choice.delta.content) {
          yield { type: 'chunk', content: choice.delta.content };
          turnContent += choice.delta.content;
        }

        if (choice.delta.tool_calls) {
          for (const tcDelta of choice.delta.tool_calls) {
            const idx = tcDelta.index ?? Math.max(0, lastCreatedToolCallIdx);
            if (!accumulatedToolCalls[idx]) {
              accumulatedToolCalls[idx] = {
                id: tcDelta.id || `tc_${Date.now()}_${idx}`,
                type: tcDelta.type || 'function',
                function: { name: '', arguments: '' },
              };
              lastCreatedToolCallIdx = idx;
            }
            if (tcDelta.function?.name) {
              accumulatedToolCalls[idx].function.name += tcDelta.function.name;
              yield { type: 'tool_call_start', toolCallId: accumulatedToolCalls[idx].id, name: accumulatedToolCalls[idx].function.name };
            }
            if (tcDelta.function?.arguments) {
              accumulatedToolCalls[idx].function.arguments += tcDelta.function.arguments;
              yield { type: 'tool_call_arg', toolCallId: accumulatedToolCalls[idx].id, args: accumulatedToolCalls[idx].function.arguments };
            }
          }
        }

        if (choice.finish_reason === 'stop') hasStopReason = true;
      }
    } catch (streamError) {
      let errMsg;
      if (typeof streamError.message === 'string') {
        errMsg = streamError.message;
      } else {
        try { errMsg = JSON.stringify(streamError.message); } catch (_) { errMsg = `Stream error (${streamError.constructor.name || 'Error'})`; }
      }
      logger.error(`Stream error in runLoop: ${errMsg}`);
      yield { type: 'error', message: errMsg };
      yield { type: 'done', content: fullFinalContent || '', truncated: true };
      return;
    }

    const completedToolCalls = Object.values(accumulatedToolCalls);
    if (completedToolCalls.length > 0) {
      const toolCallObjs = completedToolCalls.map(tc => ({
        id: tc.id, function: { name: tc.function.name, arguments: tc.function.arguments ? JSON.stringify(JSON.parse(tc.function.arguments)) : '{}' }, type: tc.type,
      }));

      await addMessageToSessionJSON(sessionId, 'assistant', null, {
        tool_calls: toolCallObjs,
        model: metadata?.model || 'llama-3-8b',
        citations: ragCitations.map(c => ({
          source_id: c.source.document_id, filename: c.source.filename,
          chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
        })),
      });

      for (const tcObj of toolCallObjs) {
        const result = await executeToolCall(tcObj, session, tools);
        messages.push(result);
        await addMessageToSessionJSON(sessionId, 'tool', result.content, { tool_call_id: result.tool_call_id });
        yield { type: 'tool_result', tool_call_id: result.tool_call_id, content: result.content };
      }

      if (hasStopReason) {
        fullFinalContent = turnContent || `Executed ${completedToolCalls.length} tool(s).`;
        break;
      }

      turn++;
      if (turn < maxTurns) yield { type: 'turn_start', turn, maxTurns };
      continue;
    }

    if (hasStopReason || turnContent.length > 0) {
      await addMessageToSessionJSON(sessionId, 'assistant', turnContent, {
        model: metadata?.model || 'llama-3-8b',
        citations: ragCitations.map(c => ({
          source_id: c.source.document_id, filename: c.source.filename,
          chunk_index: c.source.chunk_index, similarity: c.source.similarity, sheet_name: c.source.sheet_name,
        })),
      });
      fullFinalContent = turnContent;
      break;
    }

    turn++;
    if (turn < maxTurns) yield { type: 'turn_start', turn, maxTurns };
  }

  const truncated = turn >= maxTurns;
  if (truncated) {
    logger.warn(`Max tool turns (${maxTurns}) exceeded for session ${sessionId}`);
    if (!fullFinalContent) {
      fullFinalContent = `Response truncated: exceeded maximum tool turns (${maxTurns}). The assistant may be stuck in a loop.`;
    }
  }

  let newSubject = null;
  if (session.session_name === 'New Chat') {
    try {
      const msgs = Array.isArray(session.messages) ? session.messages : [];
      const subject = await generateSessionSubject(msgs);
      if (subject && subject.trim()) {
        await knex().from('chat_sessions').where({ id: sessionId }).update({ session_name: subject.trim() });
        newSubject = subject.trim();
      }
    } catch (err) {
      logger.error('Failed to generate/update session subject:', err.message);
    }
  }

  try {
    await triggerAutomaticMemoryExtraction(session, session.user_id);
  } catch (memErr) {
    logger.error('Memory extraction after streamRunLoop failed:', memErr.message);
  }

  yield { type: 'done', content: fullFinalContent, truncated, subject: newSubject };
}

const clearSessionMessages = async (sessionId) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    await clearSessionMessagesJSON(sessionId);

    const updatedSession = await knex().from('chat_sessions').where({ id: sessionId }).first();

    return { success: true, data: { ...updatedSession, chat_id: updatedSession.id } };
  } catch (error) {
    logger.error('Clear messages failed:', error.message);
    throw error;
  }
};

const updateSessionMemory = async (sessionId, memoryData) => {
  try {
    const session = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!session) throw new Error('Session not found');

    await updateSessionMemoryJSON(sessionId, memoryData);

    const updatedSession = await knex().from('chat_sessions').where({ id: sessionId }).first();

    return { success: true, data: { ...updatedSession, chat_id: updatedSession.id } };
  } catch (error) {
    logger.error('Update session memory failed:', error.message);
    throw error;
  }
};

const getSessionsByUser = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;

    // Count sessions with at least one message
    const totalRows = await knex().from('chat_sessions')
      .where({ user_id: userId })
      .whereRaw('JSON_LENGTH(messages) > 0');
    const total = parseInt(totalRows[0]?.count || 0);

    const skip = (page - 1) * limit;
    const sessions = await knex().from('chat_sessions')
      .where({ user_id: userId })
      .whereRaw('JSON_LENGTH(messages) > 0')
      .orderBy('created_at', 'desc')
      .offset(skip)
      .limit(limit);

    const result = sessions.map(session => {
      const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || []);
      const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
      return {
        chat_id: session.id,
        session_name: session.session_name,
        message_count: msgs.length,
        last_message: lastAssistant ? (lastAssistant.content.length > 50 ? lastAssistant.content.substring(0, 50) + '...' : lastAssistant.content) : '',
        created_at: session.created_at,
        updated_at: session.updated_at,
      };
    });

    return { success: true, data: { sessions: result, total, page, limit, totalPages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Get user sessions failed:', error);
    throw error;
  }
};

const deleteSession = async (sessionId) => {
  try {
    await knex().from('tool_calls').where({ session_id: sessionId }).del();
    await knex().from('chat_messages').where({ session_id: sessionId }).del();
    const existing = await knex().from('chat_sessions').where({ id: sessionId }).first();
    if (!existing) throw new Error('Session not found');
    await knex().from('chat_sessions').where({ id: sessionId }).del();

    logger.info(`Session deleted: ${sessionId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete session failed:', error.message);
    throw error;
  }
};

const generateSessionSubject = (messages) => {
  try {
    const userMessages = messages
      .filter(m => m.role === 'user' && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(0, 2);

    if (userMessages.length === 0) return null;

    const firstUserMsg = userMessages[0].content.trim();
    if (firstUserMsg.length <= 60) return firstUserMsg;

    const trimmed = firstUserMsg.substring(0, 57).replace(/\s+\S*$/, '') + '...';
    return trimmed;
  } catch (error) {
    logger.error('Generate session subject failed:', error.message);
    return null;
  }
};

const getToolCalls = async (sessionId, messageId) => {
  try {
    let query = knex().from('tool_calls').where({ session_id: sessionId });
    if (messageId) query = query.where({ message_id: messageId });

    const toolCalls = await query.orderBy('created_at', 'asc');

    return { success: true, data: toolCalls };
  } catch (error) {
    logger.error('Get tool calls failed:', error.message);
    throw error;
  }
};

module.exports = {
  createChatSession,
  addMessageToSession,
  getMessages,
  chatWithLLM,
  runLoop,
  streamRunLoop,
  streamChatResponse,
  clearSessionMessages,
  updateSessionMemory,
  getSessionsByUser,
  deleteSession,
  getToolCalls,
  generateSessionSubject,
};
