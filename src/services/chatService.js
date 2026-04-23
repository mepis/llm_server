const ChatSession = require('../models/ChatSession');
const ToolCall = require('../models/ToolCall');
const RAGDocument = require('../models/RAGDocument');
const Config = require('../models/Config');
const ragService = require('./ragService');
const llamaService = require('./llamaService');
const toolRegistry = require('../tool/registry');
const { getBuiltinTools } = require('../tool');
const skillService = require('./skillService');
const logger = require('../utils/logger');

async function getMaxToolTurns() {
  try {
    const configDoc = await Config.findOne({ key: 'MAX_TOOL_TURNS' });
    if (configDoc) {
      return parseInt(configDoc.value) || 10;
    }
  } catch (error) {
    logger.error('Failed to get MAX_TOOL_TURNS from config:', error.message);
  }
  return 10;
}

async function buildSkillsPrompt(userRoles) {
  try {
    const result = await skillService.getAccessibleSkills(userRoles);
    const skills = result.data;

    if (skills.length === 0) return null;

    const skillEntries = skills
      .map(
        (skill) =>
          `  <skill>
    <name>${skill.name}</name>
    <description>${skill.description}</description>
    <location>${skill.location}</location>
  </skill>`
      )
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
  const builtinTools = getBuiltinTools();
  const customTools = await toolRegistry.loadCustomTools(session.metadata?.model);
  const allTools = [...builtinTools, ...customTools];
  const openAITools = toolRegistry.toOpenAITools(allTools);
  return { tools: allTools, openAITools };
}

function buildMessages(session) {
  const msgs = Array.isArray(session.messages) ? session.messages : [];
  return msgs.map((msg) => {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      return {
        role: 'assistant',
        content: null,
        tool_calls: msg.tool_calls,
      };
    }
    if (msg.role === 'tool' && msg.tool_call_id) {
      return {
        role: 'tool',
        tool_call_id: msg.tool_call_id,
        content: msg.content || '',
      };
    }
    return {
      role: msg.role,
      content: msg.content || '',
    };
  });
}

async function createChatSession(userId, sessionName, options = {}) {
  try {
    const {
      model = 'llama-3-8b',
      temperature = 0.7,
      maxTokens = 2048,
      enableRAG = false,
      ragDocuments = [],
    } = options;

    const session = await ChatSession.create({
      user_id: userId,
      session_name: sessionName,
      metadata: {
        model,
        temperature,
        max_tokens: maxTokens,
      },
      rag_enabled: enableRAG,
      rag_document_ids: ragDocuments,
    });

    logger.info(`Chat session created: ${session._id} for user ${userId}`);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error('Create chat session failed:', error.message);
    throw error;
  }
}

async function addMessageToSession(sessionId, role, content) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    await session.addMessage(role, content);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error('Add message failed:', error.message);
    throw error;
  }
}

async function getMessages(sessionId) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return {
      success: true,
      data: session.messages,
    };
  } catch (error) {
    logger.error('Get messages failed:', error.message);
    throw error;
  }
}

async function executeToolCall(toolCall, session, allTools) {
  const toolName = toolCall.function?.name || toolCall.tool_name;
  const toolCallId = toolCall.id || toolCall.tool_call_id;
  const input = toolCall.function?.arguments
    ? JSON.parse(toolCall.function.arguments)
    : toolCall.input || {};

  const toolCallDoc = await ToolCall.create({
    session_id: session._id,
    message_id: toolCallId,
    tool_call_id: toolCallId,
    tool_name: toolName,
    input,
    state: 'running',
  });

  const tool = allTools.find((t) => t.id === toolName);

  if (!tool) {
    await ToolCall.findByIdAndUpdate(toolCallDoc._id, {
      state: 'error',
      output: `Unknown tool: ${toolName}`,
      error: `Unknown tool: ${toolName}`,
    });
    return {
      role: 'tool',
      tool_call_id: toolCallId,
      content: `Error: Unknown tool "${toolName}"`,
    };
  }

  const ctx = {
    sessionID: session._id.toString(),
    messageID: toolCallId,
    agent: 'assistant',
    abort: new AbortController().signal,
    messages: session.messages,
    metadata: async (val) => {},
    ask: async (req) => {
      await ToolCall.findByIdAndUpdate(toolCallDoc._id, {
        state: 'pending',
        output: `Question: ${req.question}`,
      });
    },
  };

  try {
    const result = await tool.execute(input, ctx);
    const output = result.output || '';

    await ToolCall.findByIdAndUpdate(toolCallDoc._id, {
      state: 'completed',
      output,
      title: result.title,
      metadata: result.metadata || {},
    });

    return {
      role: 'tool',
      tool_call_id: toolCallId,
      content: output,
    };
  } catch (error) {
    await ToolCall.findByIdAndUpdate(toolCallDoc._id, {
      state: 'error',
      output: `Error: ${error.message}`,
      error: error.message,
    });

    return {
      role: 'tool',
      tool_call_id: toolCallId,
      content: `Error executing tool "${toolName}": ${error.message}`,
    };
  }
}

async function chatWithLLM(sessionId, content, options = {}) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const { temperature, max_tokens, top_p } = {
      temperature: session.metadata?.temperature || 0.7,
      max_tokens: session.metadata?.max_tokens || 2048,
      top_p: session.metadata?.top_p || 0.9,
      ...options,
    };

    await session.addMessage('user', content);

    const messages = buildMessages(session);

    const { tools, openAITools } = await resolveTools(session);

    let ragContext = '';
    if (session.rag_enabled && session.rag_document_ids.length > 0) {
      const ragResult = await ragService.searchDocuments(
        session.rag_document_ids,
        content
      );
      if (ragResult && ragResult.data && ragResult.data.length > 0) {
        ragContext = ragResult.data
          .map((doc) => doc.content)
          .join('\n\n');
      }
    }

    const userRoles = options.userRoles || ['user'];
    const skillsPrompt = await buildSkillsPrompt(userRoles);

    let systemMessage = 'You are a helpful assistant.';
    if (ragContext) {
      systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers.`;
    }
    if (skillsPrompt) {
      systemMessage = skillsPrompt + '\n\n' + systemMessage;
    }

    const finalMessages = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    const response = await llamaService.chatWithTools(finalMessages, openAITools, {
      temperature,
      max_tokens,
      top_p,
    });

    const assistantMessage = response.choices?.[0]?.message || {};
    const contentText = assistantMessage.content || '';
    const toolCalls = assistantMessage.tool_calls || [];

    if (toolCalls && toolCalls.length > 0) {
      await session.addMessage('assistant', null, {
        tool_calls: toolCalls,
        model: session.metadata?.model || 'llama-3-8b',
      });

      const toolResults = [];
      for (const tc of toolCalls) {
        const result = await executeToolCall(tc, session, tools);
        toolResults.push(result);
      }

      return {
        success: true,
        data: {
          content: null,
          tool_calls: toolCalls,
          tool_results: toolResults,
        },
        session,
        needsMoreTurns: true,
      };
    }

    await session.addMessage('assistant', contentText, {
      model: session.metadata?.model || 'llama-3-8b',
    });

    return {
      success: true,
      data: contentText,
      session,
      needsMoreTurns: false,
    };
  } catch (error) {
    logger.error('Chat with LLM failed:', error.message);
    throw error;
  }
}

async function runLoop(sessionId, content, options = {}) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const { temperature, max_tokens, top_p } = {
      temperature: session.metadata?.temperature || 0.7,
      max_tokens: session.metadata?.max_tokens || 2048,
      top_p: session.metadata?.top_p || 0.9,
      ...options,
    };

    await session.addMessage('user', content);

    const messages = buildMessages(session);

    const { tools, openAITools } = await resolveTools(session);

    let ragContext = '';
    if (session.rag_enabled && session.rag_document_ids.length > 0) {
      const ragResult = await ragService.searchDocuments(
        session.rag_document_ids,
        content
      );
      if (ragResult && ragResult.data && ragResult.data.length > 0) {
        ragContext = ragResult.data
          .map((doc) => doc.content)
          .join('\n\n');
      }
    }

    const userRoles = options.userRoles || ['user'];
    const skillsPrompt = await buildSkillsPrompt(userRoles);

    let systemMessage = 'You are a helpful assistant.';
    if (ragContext) {
      systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers.`;
    }
    if (skillsPrompt) {
      systemMessage = skillsPrompt + '\n\n' + systemMessage;
    }

    let turn = 0;
    const maxTurns = await getMaxToolTurns();
    let finalContent = '';

    while (turn < maxTurns) {
      const finalMessages = [
        { role: 'system', content: systemMessage },
        ...messages,
      ];

      const response = await llamaService.chatWithTools(
        finalMessages,
        openAITools,
        {
          temperature,
          max_tokens,
          top_p,
        }
      );

      const assistantMessage = response.choices?.[0]?.message || {};
      const contentText = assistantMessage.content || '';
      const toolCalls = assistantMessage.tool_calls || [];

      if (toolCalls && toolCalls.length > 0) {
        await session.addMessage('assistant', null, {
          tool_calls: toolCalls,
          model: session.metadata?.model || 'llama-3-8b',
        });

        for (const tc of toolCalls) {
          const result = await executeToolCall(tc, session, tools);
          messages.push(result);

          await session.addMessage('tool', result.content, {
            tool_call_id: result.tool_call_id,
          });
        }

        turn++;
        continue;
      }

      await session.addMessage('assistant', contentText, {
        model: session.metadata?.model || 'llama-3-8b',
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
          await session.updateOne({ session_name: subject.trim() });
          logger.info(`Auto-generated subject for session ${sessionId}: "${subject}"`);
        }
      } catch (err) {
        logger.error('Failed to generate/update session subject:', err.message);
      }
    }

    return {
      success: true,
      data: finalContent,
      session,
    };
  } catch (error) {
    logger.error('Run loop failed:', error.message);
    throw error;
  }
}

async function* streamChatResponse(sessionId, messages, options) {
  const session = await ChatSession.findById(sessionId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await llamaService.getChatCompletions(messages, {
      ...options,
      stream: true,
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
      model: session.metadata?.model || 'llama-3-8b',
    });
  } catch (error) {
    logger.error('Streaming chat error:', error.message);
    throw error;
  }
}

async function* streamRunLoop(sessionId, content, options = {}) {
  const session = await ChatSession.findById(sessionId);

  if (!session) {
    yield { type: 'error', message: 'Session not found' };
    return;
  }

  const { temperature, max_tokens, top_p } = {
    temperature: session.metadata?.temperature || 0.7,
    max_tokens: session.metadata?.max_tokens || 2048,
    top_p: session.metadata?.top_p || 0.9,
    ...options,
  };

  await session.addMessage('user', content);

  const messages = buildMessages(session);
  const { tools, openAITools } = await resolveTools(session);

  let ragContext = '';
  if (session.rag_enabled && session.rag_document_ids.length > 0) {
    const ragResult = await ragService.searchDocuments(
      session.rag_document_ids,
      content
    );
    if (ragResult && ragResult.data && ragResult.data.length > 0) {
      ragContext = ragResult.data
        .map((doc) => doc.content)
        .join('\n\n');
    }
  }

  const userRoles = options.userRoles || ['user'];
  const skillsPrompt = await buildSkillsPrompt(userRoles);

  let systemMessage = 'You are a helpful assistant.';
  if (ragContext) {
    systemMessage += `\n\nHere is relevant context from the knowledge base:\n\n${ragContext}\n\nUse this context to provide accurate answers.`;
  }
  if (skillsPrompt) {
    systemMessage = skillsPrompt + '\n\n' + systemMessage;
  }

  let turn = 0;
  const maxTurns = await getMaxToolTurns();
  let fullFinalContent = '';

  yield { type: 'turn_start', turn, maxTurns };

  while (turn < maxTurns) {
    const finalMessages = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    let turnContent = '';
    const accumulatedToolCalls = {};
    let hasStopReason = false;

    try {
      for await (const chunk of llamaService.streamChatWithTools(
        finalMessages,
        openAITools,
        { temperature, max_tokens, top_p }
      )) {
        const choice = chunk.choices?.[0];
        if (!choice?.delta) continue;

        if (choice.delta.content) {
          yield { type: 'chunk', content: choice.delta.content };
          turnContent += choice.delta.content;
        }

        if (choice.delta.tool_calls) {
          for (const tcDelta of choice.delta.tool_calls) {
            const idx = tcDelta.index ?? Object.keys(accumulatedToolCalls).length - 1;

            if (!accumulatedToolCalls[idx]) {
              accumulatedToolCalls[idx] = {
                id: tcDelta.id || `tc_${Date.now()}_${idx}`,
                type: tcDelta.type || 'function',
                function: { name: '', arguments: '' },
              };
            }

            if (tcDelta.function?.name) {
              accumulatedToolCalls[idx].function.name += tcDelta.function.name;
              yield {
                type: 'tool_call_start',
                toolCallId: accumulatedToolCalls[idx].id,
                name: accumulatedToolCalls[idx].function.name,
              };
            }

            if (tcDelta.function?.arguments) {
              accumulatedToolCalls[idx].function.arguments += tcDelta.function.arguments;
              yield {
                type: 'tool_call_arg',
                toolCallId: accumulatedToolCalls[idx].id,
                args: accumulatedToolCalls[idx].function.arguments,
              };
            }
          }
        }

        if (choice.finish_reason === 'stop') {
          hasStopReason = true;
        }
      }
    } catch (streamError) {
      logger.error('Stream error in runLoop:', streamError.message);
      yield { type: 'error', message: streamError.message };
      yield { type: 'done', content: fullFinalContent || '', truncated: true };
      return;
    }

    // Execute all accumulated tool calls as a batch (matching non-streaming runLoop behavior)
    const completedToolCalls = Object.values(accumulatedToolCalls);
    if (completedToolCalls.length > 0) {
      const toolCallObjs = completedToolCalls.map((tc) => ({
        id: tc.id,
        function: { name: tc.function.name, arguments: JSON.stringify(JSON.parse(tc.function.arguments)) },
        type: tc.type,
      }));

      await session.addMessage('assistant', null, {
        tool_calls: toolCallObjs,
        model: session.metadata?.model || 'llama-3-8b',
      });

      for (const tcObj of toolCallObjs) {
        const result = await executeToolCall(tcObj, session, tools);
        messages.push(result);

        await session.addMessage('tool', result.content, {
          tool_call_id: result.tool_call_id,
        });

        yield { type: 'tool_result', tool_call_id: result.tool_call_id, content: result.content };
      }

      if (hasStopReason) {
        // LLM finished with tool calls but no text answer — this shouldn't happen normally
        // Treat as if it's done since the stream ended
        fullFinalContent = turnContent || `Executed ${completedToolCalls.length} tool(s).`;
        break;
      }

      turn++;
      if (turn < maxTurns) {
        yield { type: 'turn_start', turn, maxTurns };
      }
      continue;
    }

    // No tool calls — final answer from the LLM
    if (hasStopReason || turnContent.length > 0) {
      await session.addMessage('assistant', turnContent, {
        model: session.metadata?.model || 'llama-3-8b',
      });
      fullFinalContent = turnContent;
      break;
    }

    // Empty turn — increment and continue
    turn++;
    if (turn < maxTurns) {
      yield { type: 'turn_start', turn, maxTurns };
    }
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
        await session.updateOne({ session_name: subject.trim() });
        logger.info(`Auto-generated subject for session ${sessionId}: "${subject}"`);
        newSubject = subject.trim();
      }
    } catch (err) {
      logger.error('Failed to generate/update session subject:', err.message);
    }
  }

  yield { type: 'done', content: fullFinalContent, truncated, subject: newSubject };
}

async function clearSessionMessages(sessionId) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    await session.clearMessages();

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error('Clear messages failed:', error.message);
    throw error;
  }
}

async function updateSessionMemory(sessionId, memoryData) {
  try {
    const session = await ChatSession.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    await session.updateMemory(memoryData);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error('Update session memory failed:', error.message);
    throw error;
  }
}

async function getSessionsByUser(userId, options = {}) {
  try {
    const { page = 1, limit = 10 } = options;
    const query = { user_id: userId, 'messages.0': { $exists: true } };

    const total = await ChatSession.countDocuments(query);
    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const result = sessions.map(session => {
      const msgs = session.messages || [];
      const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
      return {
        chat_id: session._id.toString(),
        session_name: session.session_name,
        message_count: msgs.length,
        last_message: lastAssistant ? (lastAssistant.content.length > 50 ? lastAssistant.content.substring(0, 50) + '...' : lastAssistant.content) : '',
        created_at: session.created_at,
        updated_at: session.updated_at,
      };
    });

    return {
      success: true,
      data: {
        sessions: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get user sessions failed:', error);
    throw error;
  }
}

async function deleteSession(sessionId) {
  try {
    await ToolCall.deleteMany({ session_id: sessionId });
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
}

async function generateSessionSubject(messages) {
  try {
    const userMessages = messages
      .filter(m => m.role === 'user' && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(0, 2);

    if (userMessages.length === 0) return null;

    const firstUserMsg = userMessages[0].content.trim();
    if (firstUserMsg.length <= 60) {
      return firstUserMsg;
    }

    const trimmed = firstUserMsg.substring(0, 57).replace(/\s+\S*$/, '') + '...';
    return trimmed;
  } catch (error) {
    logger.error('Generate session subject failed:', error.message);
    return null;
  }
}

async function getToolCalls(sessionId, messageId) {
  try {
    const query = { session_id: sessionId };
    if (messageId) {
      query.message_id = messageId;
    }

    const toolCalls = await ToolCall.find(query).sort({ created_at: 1 });

    return {
      success: true,
      data: toolCalls,
    };
  } catch (error) {
    logger.error('Get tool calls failed:', error.message);
    throw error;
  }
}

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
