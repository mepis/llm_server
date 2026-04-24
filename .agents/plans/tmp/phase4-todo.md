# Phase 4: Multi-Layer Memory System - Detailed Todo List

**Phase**: 4 of 6  
**Dependencies**: None (independent of RAG features, but integrates with chatService)  
**Estimated effort**: ~3-4 days  

---

## Purpose

Implement a three-layer persistent memory system per user that survives across chat sessions: episodic (recent conversations), semantic (factual knowledge), and procedural (user preferences/behaviors). This gives the LLM context about who the user is, what they've discussed before, and how they prefer to interact.

---

## Task 4.1: Create UserMemory Model

**File**: `src/models/UserMemory.js`

- [ ] Create schema:
  ```javascript
  const userMemorySchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    layer: {
      type: String,
      enum: ['episodic', 'semantic', 'procedural'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      source_session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        default: null
      },
      keywords: [{ type: String, trim: true }],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.8
      },
      created_at: { type: Date, default: Date.now },
      expires_at: { type: Date, default: null }, // TTL for episodic
      last_accessed: { type: Date, default: null },
      access_count: { type: Number, default: 0 }
    },
    tags: [{ type: String, trim: true }]
  }, { timestamps: true });
  ```

- [ ] Create indexes:
  - `{ user_id: 1, layer: 1, created_at: -1 }` — query memories by user+layer
  - `{ 'metadata.expires_at': 1 }` — TTL index for episodic memory cleanup
  - `{ tags: 1 }` — text search across memory tags

- [ ] Add instance methods:
  - `recordAccess()` — increments access_count, updates last_accessed; if access_count % 5 === 0 AND layer === 'episodic', extends expires_at by 7 days (recency-based TTL extension)
  - `isExpired()` — returns true if expires_at is set and past
  
- [ ] Add post-find hook to auto-record access:
  ```javascript
  userMemorySchema.post('find', function(docs) {
    docs.forEach(doc => doc.recordAccess());
  });
  ```
  
- [ ] Add static methods:
  - `getByLayer(userId, layer, limit)` — get memories for a specific layer
  - `searchSemantic(userId, query)` — keyword search across semantic memories
  - `cleanupExpired()` — delete expired episodic memories (for scheduled job)
  - `consolidateSemantic(userId)` — merge similar semantic memories

- [ ] Add pre-save hook to set expires_at for episodic memories:
  ```javascript
  userMemorySchema.pre('save', function(next) {
    if (this.layer === 'episodic' && !this.metadata.expires_at) {
      this.metadata.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    next();
  });
  ```

**Acceptance criteria:**
- Schema validates all field types and constraints
- TTL index correctly expires episodic memories after 30 days
- getByLayer returns correct memories sorted by recency
- searchSemantic returns matching semantic memories by keyword

---

## Task 4.2: Create MemoryManager Service

**File**: `src/services/memoryManager.js`

- [ ] Implement `addEpisodicMemory(userId, content, sessionId)`:
  - Creates UserMemory with layer='episodic'
  - Extracts keywords from content (use first 5 significant words)
  - Sets source_session_id
  - Returns created memory document

- [ ] Implement `addSemanticMemory(userId, content, keywords)`:
  - Creates UserMemory with layer='semantic'
  - Keywords provided by caller (from MemoryExtractor)
  - No expiration (persists indefinitely)
  - Checks for duplicate/similar memories before inserting (consolidation)

- [ ] Implement `addProceduralMemory(userId, content, keywords)`:
  - Creates UserMemory with layer='procedural'
  - Represents user preferences and behavioral patterns
  - No expiration (persists until manually deleted)
  - Higher confidence threshold (procedural memories are more reliable)

- [ ] Implement `getEpisodicMemory(userId, limit = 5)`:
  - Returns most recent non-expired episodic memories
  - Records access on each retrieval
  - Returns formatted for system message injection

- [ ] Implement `getSemanticMemory(userId, query)`:
  - If query provided: keyword search across semantic memories
  - If no query: return all semantic memories (limited to top 10 by recency)
  - Records access on each retrieval

- [ ] Implement `getProceduralMemory(userId)`:
  - Returns all procedural memories (user preferences/patterns)
  - Limited to 20 entries max

- [ ] Implement `getAllMemoriesForContext(userId, query)`:
  - Combines all three layers into a single context string
  - Prioritizes: procedural > semantic (query-matched) > episodic (recent)
  - Returns `{ systemContent, memorySources }` for chatService integration

- [ ] Implement `deleteMemory(memoryId, userId)`:
  - Validates memory belongs to userId
  - Soft delete (set content to '[deleted]') or hard delete

- [ ] Implement `consolidateSemantics(userId)`:
  - Finds semantic memories with overlapping keywords
  - Merges them into single consolidated entry
  - Preserves highest confidence score

**Acceptance criteria:**
- Episodic memories auto-expire after 30 days
- Semantic search returns relevant memories by keyword matching
- Procedural memories persist across sessions without expiration
- getAllMemoriesForContext produces token-efficient context string (<500 tokens)
- Consolidation reduces memory count while preserving information

---

## Task 4.3: Create MemoryExtractor Utility

**File**: `src/utils/memoryExtractor.js`

- [ ] Implement `extractFromConversation(messages)`:
  - Takes ChatSession.messages array
  - Analyzes messages to identify memory-worthy content
  - Returns `{ episodic: [], semantic: [], procedural: [] }`
  
- [ ] Episodic extraction rules:
  - Identify conversation topics/themes (first user message per topic shift)
  - Extract key events discussed ("We talked about the API design")
  - Limit to 3 most recent topics
  
- [ ] Semantic extraction rules:
  - Identify factual statements: "I work at X", "The system uses Y", "Z is important"
  - Filter out opinions and preferences (those go to procedural)
  - Store as concise declarative sentences
  
- [ ] Procedural extraction rules:
  - Identify user preferences: "I prefer concise answers", "Use markdown"
  - Identify behavioral patterns: "Always starts with code examples"
  - Extract from both user messages AND assistant responses (user reactions)
  
- [ ] Use llama.cpp for structured extraction:
  ```javascript
  // Call LLM with prompt to extract memories in JSON format
  const extractionPrompt = `Analyze this conversation and extract memories in the following categories:
  {
    "episodic": ["topic summaries"],
    "semantic": ["factual statements"], 
    "procedural": ["user preferences and patterns"]
  }
  
  Conversation: ${formattedMessages}
  
  Return only JSON, no other text.`;
  ```

- [ ] Parse LLM response and validate structure
- [ ] Apply confidence scoring based on extraction certainty

**Acceptance criteria:**
- extractFromConversation correctly categorizes memories into 3 layers
- Semantic extraction identifies factual statements, not opinions
- Procedural extraction captures user preferences
- LLM-based extraction produces valid JSON output

---

## Task 4.4: Add Automatic Memory Extraction to chatService

**File**: `src/services/chatService.js`

- [ ] Import memoryManager and memoryExtractor at top of file
- [ ] Define threshold constants:
  ```javascript
  const MEMORY_EXTRACTION_THRESHOLD = 10; // messages before triggering extraction
  const MEMORY_CONSOLIDATION_INTERVAL = 60 * 60 * 1000; // 1 hour between consolidations
  ```

- [ ] In `runLoop()` and `streamRunLoop()`, after conversation completes:
  ```javascript
  // Check if memory extraction should trigger
  const msgCount = session.messages.length;
  if (msgCount >= MEMORY_EXTRACTION_THRESHOLD) {
    try {
      const memories = await memoryExtractor.extractFromConversation(session.messages);
      
      for (const episodic of memories.episodic) {
        await memoryManager.addEpisodicMemory(userId, episodic.content, session._id);
      }
      for (const semantic of memories.semantic) {
        await memoryManager.addSemanticMemory(userId, semantic.content, semantic.keywords);
      }
      for (const procedural of memories.procedural) {
        await memoryManager.addProceduralMemory(userId, procedural.content, procedural.keywords);
      }
      
      logger.info(`Memory extracted for session ${sessionId}: ${memories.episodic.length} episodic, ${memories.semantic.length} semantic, ${memories.procedural.length} procedural`);
    } catch (error) {
      logger.error(`Memory extraction failed for session ${sessionId}:`, error.message);
    }
  }
  ```

- [ ] Trigger consolidation periodically (every Nth conversation):
  - Check last consolidation timestamp from user preferences or config
  - If interval passed, call memoryManager.consolidateSemantics(userId)

**Acceptance criteria:**
- Memory extraction triggers after 10+ messages in a session
- Extraction runs asynchronously (doesn't block response delivery)
- Failed extraction doesn't break the chat flow (logged but not fatal)
- Consolidation runs periodically to merge redundant semantic memories

---

## Task 4.5: Update System Message Building in chatService

**File**: `src/services/chatService.js`

- [ ] Create function `buildUserMemoryContext(userId)`:
  ```javascript
  async function buildUserMemoryContext(userId) {
    const procedural = await memoryManager.getProceduralMemory(userId);
    const semantic = await memoryManager.getSemanticMemory(userId);
    const episodic = await memoryManager.getEpisodicMemory(userId, 3);
    
    // Format token-efficiently
    let memoryContext = '';
    
    if (procedural.length > 0) {
      memoryContext += '<user_preferences>\n';
      procedural.forEach(m => {
        memoryContext += `- ${m.content}\n`;
      });
      memoryContext += '</user_preferences>\n\n';
    }
    
    if (semantic.length > 0 && semantic.results?.length > 0) {
      memoryContext += '<known_facts>\n';
      semantic.results.slice(0, 5).forEach(m => {
        memoryContext += `- ${m.content}\n`;
      });
      memoryContext += '</known_facts>\n\n';
    }
    
    if (episodic.length > 0) {
      memoryContext += '<recent_topics>\n';
      episodic.forEach(m => {
        memoryContext += `- ${m.content}\n`;
      });
      memoryContext += '</recent_topics>\n\n';
    }
    
    return { memoryContext, memorySources: [...procedural, ...semantic.results || [], ...episodic] };
  }
  ```

- [ ] Integrate into system message building (replacing current pattern):
  ```javascript
  // Before RAG context, add user memory context
  const { memoryContext, memorySources } = await buildUserMemoryContext(userId);
  
  let systemMessage = 'You are a helpful assistant.';
  if (memoryContext) {
    systemMessage += `\n\n${memoryContext}`;
  }
  if (ragContext) {
    systemMessage += `\n\nKnowledge base context:\n${ragContext}\n\nCite your sources using bracketed numbers [1], [2] etc.`;
  }
  ```

- [ ] Store memorySources in assistant message metadata for reference:
  ```javascript
  await session.addMessage('assistant', contentText, {
    citations: ragCitations,
    memory_sources: memorySources.map(m => ({ layer: m.layer, content: m.content }))
  });
  ```

**Acceptance criteria:**
- System message includes user preferences before RAG context
- Procedural memories always included (user preferences)
- Semantic memories limited to 5 most relevant
- Episodic memories limited to 3 most recent
- Total memory context stays under 500 tokens

---

## Task 4.6: Create MemoryController

**File**: `src/controllers/memoryController.js`

- [ ] Implement `getMemories(req, res)`:
  - GET /api/memory/memories?layer=episodic&limit=10
  - Returns memories filtered by layer

- [ ] Implement `getEpisodic(req, res)`:
  - GET /api/memory/episodic
  - Returns episodic memories only

- [ ] Implement `getSemantic(req, res)`:
  - GET /api/memory/semantic?q=search+query
  - Returns semantic memories with optional keyword search

- [ ] Implement `getProcedural(req, res)`:
  - GET /api/memory/procedural
  - Returns all procedural memories

- [ ] Implement `extractMemories(req, res)`:
  - POST /api/memory/extract
  - Body: { session_id }
  - Triggers manual extraction from specified session
  
- [ ] Implement `deleteMemory(req, res)`:
  - DELETE /api/memory/:id
  - Validates memory belongs to user

**Acceptance criteria:**
- All endpoints return properly formatted responses
- Layer filtering works correctly
- Manual extraction triggers the same process as automatic extraction
- Delete validates ownership

---

## Task 4.7: Create Memory Routes

**File**: `src/routes/memory.js`

- [ ] Define routes with authMiddleware:
  ```javascript
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');
  const memoryController = require('../controllers/memoryController');
  
  router.get('/memories', authMiddleware, memoryController.getMemories);
  router.get('/episodic', authMiddleware, memoryController.getEpisodic);
  router.get('/semantic', authMiddleware, memoryController.getSemantic);
  router.get('/procedural', authMiddleware, memoryController.getProcedural);
  router.post('/extract', authMiddleware, memoryController.extractMemories);
  router.delete('/:id', authMiddleware, memoryController.deleteMemory);
  
  module.exports = router;
  ```

- [ ] Register in `src/routes/api.js`:
  ```javascript
  const memoryRoutes = require('./memory');
  router.use('/memory', memoryRoutes);
  ```

**Acceptance criteria:**
- All routes accessible at `/api/memory/*`
- Routes protected by authMiddleware
- Follows existing route file pattern

---

## Notes for Implementers

- **Token budget**: Memory context + RAG context + chat history must fit within llama.cpp's context window. Implement a budget tracker that caps each component:
  - Chat history: last 20 messages (or trim older ones)
  - RAG context: max 5 results × ~200 tokens = ~1000 tokens
  - Memory context: max ~300 tokens total
  - System prompt / skills: ~500 tokens
  
- **Consolidation strategy**: When adding a new semantic memory, check if existing memories have >60% keyword overlap. If so, merge rather than duplicate.

- **Episodic decay**: Consider not just TTL but also recency-based scoring. Memories accessed frequently could have their expires_at extended.

- **Privacy note**: Memory extraction should NOT extract sensitive information (passwords, personal IDs, financial data). Add a filter in MemoryExtractor to redact PII patterns.
