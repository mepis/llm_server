const llamaService = require('./llamaService');
const memoryManager = require('./memoryManager');
const logger = require('../utils/logger');

const redactPII = (text) => {
  let redacted = text;
  
  redacted = redacted.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );
  
  redacted = redacted.replace(
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    '[PHONE_REDACTED]'
  );
  
  redacted = redacted.replace(
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    '[CARD_REDACTED]'
  );
  
  redacted = redacted.replace(
    /(?:sk-|pk_)[a-zA-Z0-9]{20,}/g,
    '[API_KEY_REDACTED]'
  );
  
  redacted = redacted.replace(
    /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
    '[URL_REDACTED]'
  );
  
  return redacted;
};

const extractFromConversation = async (messages) => {
  try {
    const userAssistantMessages = messages.filter(
      m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0
    );
    
    if (userAssistantMessages.length < 2) {
      return {
        episodic: [],
        semantic: [],
        procedural: []
      };
    }
    
    try {
      const llmResult = await extractWithLLM(userAssistantMessages);
      
      return {
        episodic: (llmResult.episodic || []).map(e => ({ ...e, content: redactPII(e.content) })),
        semantic: (llmResult.semantic || []).map(s => ({ ...s, content: redactPII(s.content) })),
        procedural: (llmResult.procedural || []).map(p => ({ ...p, content: redactPII(p.content) }))
      };
    } catch (llmError) {
      logger.warn('LLM extraction failed, using keyword-based fallback:', llmError.message);
      return extractWithKeywords(userAssistantMessages);
    }
  } catch (error) {
    logger.error('Extract from conversation failed:', error.message);
    return { episodic: [], semantic: [], procedural: [] };
  }
};

const extractWithLLM = async (messages) => {
  const formattedConversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const extractionPrompt = `Analyze this conversation and extract memories in the following JSON format:
{
  "episodic": ["brief topic summaries from first user message per topic shift"],
  "semantic": ["factual statements about users, systems, or facts"],
  "procedural": ["user preferences, patterns, or behavioral rules"]
}

Rules:
- Episodic: conversation topics discussed (limit 3)
- Semantic: declarative factual statements only (not opinions)  
- Procedural: preference keywords like "prefer", "always", "never", "use"

Conversation:
${formattedConversation}

Return only valid JSON, no other text.`;

  const response = await llamaService.chatWithLLM([{ role: 'user', content: extractionPrompt }], [], {
    max_tokens: 1000,
    temperature: 0.3
  });
  
  const content = response.choices?.[0]?.message?.content || '';
  
  try {
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (parseError) {
    logger.warn('Failed to parse LLM extraction result:', parseError.message);
    throw new Error('LLM extraction returned invalid JSON');
  }
};

const extractWithKeywords = (messages) => {
  const userMessages = messages.filter(m => m.role === 'user');
  
  const episodic = [];
  const semantic = [];
  const procedural = [];
  
  for (let i = 0; i < Math.min(userMessages.length, 3); i++) {
    const msg = userMessages[i].content.trim();
    if (msg.length > 20) {
      episodic.push({
        content: msg.substring(0, 150) + (msg.length > 150 ? '...' : ''),
        keywords: memoryManager.extractKeywords(msg, 3),
        confidence: 0.6
      });
    }
  }
  
  const semanticPatterns = [
    /(?:is|are|was|were)\s+(.+?)(?:\.|!|\?)/g,
    /(?:uses|uses to|use)\s+(.+?)(?:\.|!|\?)/g,
    /(?:have|has|had)\s+(.+?)(?:\.|!|\?)/g
  ];
  
  for (const msg of userMessages) {
    const content = msg.content;
    
    for (const pattern of semanticPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].trim().length > 5 && match[1].trim().length < 200) {
          semantic.push({
            content: match[1].trim(),
            keywords: memoryManager.extractKeywords(match[1], 4),
            confidence: 0.7
          });
        }
      }
    }
  }
  
  const proceduralPatterns = [
    /(?:prefer|always|never|should|must|don't like|like to)\s+(.+?)(?:\.|!|\?)/gi,
    /(?:use|try|start with)\s+(.+?)(?:\.|!|\?)/gi
  ];
  
  for (const msg of userMessages) {
    const content = msg.content;
    
    for (const pattern of proceduralPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].trim().length > 3 && match[1].trim().length < 200) {
          procedural.push({
            content: match[1].trim(),
            keywords: memoryManager.extractKeywords(match[1], 4),
            confidence: 0.8
          });
        }
      }
    }
  }
  
  return { episodic, semantic, procedural };
};

module.exports = {
  redactPII,
  extractFromConversation
};
