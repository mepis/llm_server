tags: [persistent-memory, episodic, semantic, procedural]
role: [developer, researcher]

# Persistent Memory

Three-layer memory system for long-term user context retention across sessions.

## Overview

The Persistent Memory feature stores user information in three layers — episodic (recent topics), semantic (factual knowledge), and procedural (preferences). Memories are extracted automatically or manually from conversation history, deduplicated via keyword overlap, and injected into the LLM system message before each response.

**Base path:** `/api/memory`

## Three-Layer Architecture

```
+---------------------------------------------------------------+
|                    User Memory System                         |
+---------------------------------------------------------------+
|                                                               |
|  +-------------------+  +------------------+  +------------+ |
|  |   EPISODIC        |  |   SEMANTIC       |  | PROCEDURAL | |
|  | (recent topics)   |  | (factual facts)  |  | (preferences)| |
|  +-------------------+  +------------------+  +------------+ |
|  | 30-day auto      |  | Dedup via        |  | Style, lang| |
|  | expiry            |  | keyword overlap  |  | patterns   | |
|  | Confidence: 0.8   |  | >0.6 overlap =   |  | Confidence:| |
|  | Access tracking   |  | merge/skip       |  | 0.9        | |
|  | Extended on freq  |  | Tags match keys  |                | |
|  | access            |  |                  |                | |
|  +-------------------+  +------------------+  +------------+ |
|                                                               |
|  All layers stored in: UserMemory model                       |
|  Injected into system message before LLM calls                |
+---------------------------------------------------------------+

Injection order in system message:
  <user_preferences>    <- procedural memories
  <known_facts>         <- semantic memories
  <recent_topics>       <- episodic memories
```

## UserMemory Model

```
+-----------------------------------------------------------+
| UserMemory                                                |
+-----------------------------------------------------------+
| _id          ObjectId                                     |
| user_id      ObjectId -> User (required)                  |
| layer        Enum: episodic, semantic, procedural         |
| content      String (required, trimmed)                   |
| embedding    [Number] (default [])                        |
| tags         [String] (for semantic/procedural)           |
| metadata:                                 |
|   source_session_id -> ChatSession                        |
|   keywords     [String]                                   |
|   confidence   Number (0-1, layer-dependent default)      |
|   extracted_at Date                                       |
|   expires_at   Date (episodic only, 30 days)              |
|   last_accessed Date                                      |
|   access_count Number                                     |
| created_at   Date                                         |
| updated_at   Date                                         |
+-----------------------------------------------------------+

Indexes:
- (user_id, layer, created_at) — compound sort index
- metadata.expires_at with TTL (auto-delete expired episodic)
- text search on (metadata.keywords, tags)
```

### Confidence Defaults by Layer

| Layer | Default Confidence | Expiry |
|---|---|---|
| Episodic | 0.8 | 30 days from creation |
| Semantic | 0.85 | None (permanent) |
| Procedural | 0.9 | None (permanent) |

### Episodic Auto-Expiry

```javascript
// Pre-save hook: set expiry to 30 days if not already set
if (layer === 'episodic' && !expires_at) {
  expires_at = now + 30 days;
}

// recordAccess(): every 5th access extends expiry by 7 more days
if (access_count % 5 === 0) {
  expires_at = now + 7 days;
}
```

## Memory Extraction Flow

```
Conversation messages collected
        |
        v
+---------------------+     fail    +--------------------+
| MEMORY_THRESHOLD    | ----------> | Keyword-based      |
| exceeded? (default  |             | fallback           |
| 10 messages)       |             |                    |
+---------------------+             +--------------------+
        | pass                         |
        v                              v
+---------------------+     fail    +--------------------+
| LLM extraction      | ----------> | Pattern matching   |
| via llamaService    |             | (regex for facts,  |
| (temperature: 0.3)  |             | preferences)       |
+---------------------+             +--------------------+
        | pass                         |
        v                              v
  JSON parse result              Episodic: first 3 user msgs
        |                          Semantic: declarative patterns
        v                          Procedural: preference patterns
+---------------------+
| PII redaction       |
| - emails            |
| - phone numbers     |
| - credit cards      |
| - API keys          |
| - URLs              |
+---------------------+
        |
        v
  Insert into UserMemory per layer
```

### Memory Extraction Trigger

Extraction is triggered when a conversation reaches `MEMORY_EXTRACTION_THRESHOLD` messages (default: 10). The extraction runs via the `POST /api/memory/extract` endpoint (manual) or can be integrated into the chat service for auto-extraction.

### PII Redaction

The `redactPII()` function in `memoryExtractor.js` masks these patterns before storage:

| Pattern | Replacement |
|---|---|
| Emails (`user@domain.com`) | `[EMAIL_REDACTED]` |
| Phone numbers (`123-456-7890`) | `[PHONE_REDACTED]` |
| Credit card numbers (16 digits) | `[CARD_REDACTED]` |
| API keys (`sk-*`, `pk_*`) | `[API_KEY_REDACTED]` |
| URLs | `[URL_REDACTED]` |

## Keyword Extraction Algorithm

```
extractKeywords(text, count=5)
        |
        v
+-------------------------+
| Lowercase text          |
| Remove non-alphanumeric |
| Split by whitespace     |
+-------------------------+
        |
        v
+---------------------------+
| Filter:                   |
| - length > 2 chars        |
| - not in stop-word list   |
+---------------------------+

Stop words: the, a, an, and, or, but, in, on, at, to, for, of, with, by,
            is, are, was, were, be, been, being, have, has, had, do, does,
            did, will, would, could, should, may, might, can, this, that,
            these, those
        |
        v
+---------------------------+
| Count word frequency      |
+---------------------------+
        |
        v
+---------------------------+
| Sort by frequency desc    |
| Take top N                |
+---------------------------+
        |
        v
  Return keywords array
```

## Memory Manager Service

All methods return `{ success: true, data: ... }` format.

| Method | Parameters | Description |
|---|---|---|
| `addEpisodicMemory(userId, content, sessionId)` | Creates with keywords, 0.8 confidence |
| `addSemanticMemory(userId, content, keywords, embedding)` | Checks overlap >0.6 against existing; skips if duplicate |
| `addProceduralMemory(userId, content, keywords)` | Creates with 0.9 confidence |
| `getEpisodicMemories(userId, limit=3)` | Excludes expired, records access |
| `getSemanticMemories(userId, query?)` | Full-text search if query provided |
| `getProceduralMemories(userId, limit=10)` | Ordered by newest first |
| `getAllMemoriesForContext(userId, query)` | Merges all layers into system message format |
| `deleteMemory(memoryId, userId)` | Owner-only deletion |
| `consolidateSemantics(userId)` | Merges overlapping semantic memories |

### getAllMemoriesForContext() Output Format

```
<user_preferences>
- prefers concise responses
- always uses British English
</user_preferences>

<known_facts>
- project uses Node.js 24
- MongoDB is the primary database
</known_facts>

<recent_topics>
- discussed authentication flow
- reviewed API endpoints
</recent_topics>
```

## Semantic Deduplication

When adding a semantic memory, the system checks keyword overlap against all existing semantic memories:

```javascript
overlap = intersect(newKeywords, existingKeywords).length;
maxKeys = max(existingKeywords.length, newKeywords.length);
ratio = overlap / maxKeys;

if ratio > 0.6 -> skip (treat as duplicate)
else           -> insert new memory
```

The `consolidateSemantics()` method performs all-pairs comparison and deletes duplicates in bulk.

## API Endpoints

### Get All Memories

```
GET /api/memory/memories?layer=episodic&limit=10&q=query
Authorization: Bearer <token>
```

Query parameters:
- `layer` — filter by layer (`episodic`, `semantic`, `procedural`), or omit for all
- `limit` — max results per layer (default: episodic=10, semantic=5, procedural=20)
- `q` — full-text search query (semantic layer only)

### Get Layer-Specific Memories

```
GET /api/memory/episodic?limit=10
GET /api/memory/semantic?q=facts
GET /api/memory/procedural
Authorization: Bearer <token>
```

### Extract Memories from Session

```
POST /api/memory/extract
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

```json
{ "session_id": "<chatSessionId>" }
```

Extracts all three layers from the session messages. Only memories with confidence >= 0.5 are stored. Returns counts by layer.

### Delete Memory

```
DELETE /api/memory/:id
Authorization: Bearer <token>
```

Users can only delete their own memories.

## Memory Context Injection

When `getAllMemoriesForContext()` is called, the returned `systemContent` string is prepended to the LLM system message before inference. This gives the model awareness of:

1. **User preferences** — language, style, formatting rules
2. **Known facts** — technical details, project information
3. **Recent topics** — conversation history context

This happens transparently in the chat flow when memory features are enabled.

## Related Pages

- [Chat Sessions](./chat-sessions.md) — session-based episodic memory source
- [RAG Documents](./rag-documents.md) — knowledge base vs user memory
- [API Reference](../api/memory-api.md)
