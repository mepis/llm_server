# RAG + Persistent Memory - Discovery Notes

Date: 2026-04-23

## Current RAG System Analysis

### What Exists
- **RAGDocument model** (`src/models/RAGDocument.js`): Basic document storage with user_id ownership, chunked_content array, embeddings array, status tracking
- **ragService** (`src/services/ragService.js`): Upload, process (chunk + embed), search via cosine similarity, delete, get chunks
- **ragController** (`src/controllers/ragController.js`): Express routes for CRUD + search + chunks
- **rag route** (`src/routes/rag.js`): 8 endpoints under `/api/rag/*`
- **Frontend rag store** (`frontend/src/stores/rag.js`): Vue Pinia store with upload, list, delete, query, search actions
- **Frontend views**: `RAGDocumentsView.vue` (document library), `RAGQueriesView.vue` (search UI)

### What's Missing (Gaps vs Requirements)

#### File Type Support
- Current supported: pdf, txt, doc, docx, md, json, csv
- Required: pdf, docx, xlsx, csv, txt, md
- **Gap**: xlsx is required but NOT in the model enum or controller fileFilter
- **Gap**: No actual file parsing libraries installed (no pdf-parse, mammoth, xlsx, etc.)
- **Gap**: The service reads `fileBuffer.toString('utf8')` for ALL types — only works for text files. PDF/DOCX/XLSX would fail silently or produce binary garbage

#### Document Groups / RBAC
- Current: Documents are tied to a single `user_id` — no concept of groups/sharing
- Required: Document groups with role-based access controls
- **Gap**: No DocumentGroup model, no group membership, no cross-user document access
- Role model exists (`src/models/Role.js`) but only has name/description/is_builtin — no permissions

#### Citations in Chat Responses
- Current: `chatService.runLoop()` and `streamRunLoop()` search RAG docs and inject context into system message as raw text
- Required: Chat responses MUST include citations and links to sources
- **Gap**: No citation tracking, no source attribution in assistant messages
- Gap: Search results are concatenated without per-chunk source info

#### Multi-Layer Memory
- Current: `ChatSession.memory` has conversation_summary, key_points, entities, preferences — all per-session only
- Required: Multi-layer persistent memory for individual users (cross-session)
- **Gap**: No user-level memory model that persists across sessions
- Gap: No automatic memory extraction from conversations
- Gap: No hierarchy of memory layers (episodic, semantic, procedural)

### Existing chatService RAG Integration
In `chatService.js` lines 259-270 and 360-370:
```javascript
if (session.rag_enabled && session.rag_document_ids.length > 0) {
  const ragResult = await ragService.searchDocuments(
    session.rag_document_ids, content
  );
  // ...concatenates doc.content without citations
}
```

Key bugs:
1. `ragService.searchDocuments(userId, query)` takes userId but chatService passes `session.rag_document_ids` (array of ObjectIds) as first arg — **this is a bug**. The service signature expects `(userId, query, limit)` but the controller calls it with `(session.rag_document_ids, content)`.
2. No citation metadata returned from search

## Current Memory System Analysis

### ChatSession.memory Schema
```javascript
memory: {
  conversation_summary: String,
  key_points: [String],
  entities: [String],
  preferences: mongoose.Schema.Types.Mixed
}
```

All per-session. No cross-session persistence. Manual updates only via `PUT /api/chat/:sessionId/memory`.

### What's Needed for Multi-Layer Memory
1. **Episodic memory**: Recent conversation summaries stored at user level (not session level)
2. **Semantic memory**: Factual knowledge extracted from conversations and documents
3. **Procedural memory**: User preferences, patterns, behaviors learned over time
4. **Working memory**: Short-term context that gets flushed/trimmed

## Existing Infrastructure to Leverage

### Already Available
- Worker pool (`src/workers/worker.js`, `src/config/workerPool.js`) — argon2 hashing only currently
- Llama.cpp embeddings endpoint (`llamaService.getEmbeddings()`) — works for RAG
- RBAC middleware (`src/middleware/rbac.js`) — authorize(), requireAdmin(), requireSystem()
- Role model and roleController/roleService exist but are minimal
- ChatSession already has rag_enabled and rag_document_ids fields
- Pinecone-like vector search via cosineSimilarity in ragService (implemented manually)

### Dependencies to Add
- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX text extraction
- `xlsx` or `exceljs` — XLSX parsing
- Optional: `langchain` for chunking utilities, but keeping it lightweight is better for small context windows
- Optional (but recommended): `@xenova/transformers` for local embeddings instead of llama.cpp embeddings endpoint (if llama.cpp doesn't support embeddings well)

### MongoDB Version Note
- AGENTS.md says "MongoDB must be running before npm run dev"
- Requirement specifies Mongo 8.2 — current package.json uses `mongoose ^8.8.0` which supports Mongo 7.x; need to verify 8.2 compatibility
- Mongoose 8.x supports MongoDB 7.x and 8.x with standard CRUD

## Key Decisions Needed

1. **Embedding strategy**: Use llama.cpp embeddings endpoint (current) vs local Transformers.js model
   - Recommendation: Keep llama.cpp for consistency, but add fallback
2. **Document group model**: New model vs extending RAGDocument
   - Recommendation: New DocumentGroup + DocumentGroupMember models for clean separation
3. **Memory persistence**: New UserMemory model vs extending User.preferences
   - Recommendation: New UserMemory model with layer types (episodic, semantic, procedural)
4. **Citation format**: Inline [1], [2] markers vs footnotes
   - Recommendation: Inline numeric markers with source list at bottom of response
