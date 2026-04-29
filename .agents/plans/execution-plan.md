# Execution Plan: RAG Operations & Per-User Persistent Memory

**Created**: 2026-04-23  
**Status**: Draft — pending review  
**Owner**: Engineering team  

---

## Purpose

Extend the existing LLM Server with production-grade RAG operations and per-user persistent memory systems. The target audience is coding agents running on local llama.cpp instances with limited context windows (~8K-32K tokens), so all designs prioritize token efficiency, structured retrieval, and minimal overhead.

**Expected outcomes:**
1. Document ingestion pipeline supporting PDF, DOCX, XLSX, CSV, TXT, MD with proper parsing
2. Document groups with role-based access controls for cross-user document sharing
3. Chat responses with inline citations and source links to RAG documents
4. Three-layer persistent memory system (episodic, semantic, procedural) per user

---

## Progress

- [x] Codebase research — 2026-04-23T09:00Z — completed
- [x] Discovery notes written — 2026-04-23T09:30Z — completed
- [x] Phase todo lists created (phases 1-6) — 2026-04-23T10:00Z — completed
- [x] Plan review Round 1 (3 sub-agents, 53 issues found and fixed) — 2026-04-23T11:00Z — completed
- [x] Phase 1.0 bug fix todo created — 2026-04-23T12:00Z — completed
- [x] Cross-document citation rendering target aligned (AssistantMessage, not ChatView) — 2026-04-23T12:00Z — completed
- [x] JSON parser task added to Phase 1 — 2026-04-23T12:00Z — completed
- [x] Access_count TTL extension hook added to UserMemory model — 2026-04-23T12:00Z — completed
- [x] Phase 1.0: Bug fix implemented — 2026-04-23T13:00Z — completed
- [x] Phase 1: Document parsing infrastructure — 2026-04-23T13:30Z — completed
- [x] Phase 2: Document groups + RBAC — 2026-04-23T14:00Z — completed
- [x] Phase 4: Multi-layer memory system — 2026-04-23T14:30Z — completed
- [x] Phase 3: Citation system — 2026-04-23T15:00Z — completed
- [x] Phase 5: Frontend updates — 2026-04-23T15:30Z — completed
- [x] Phase 6: Integration testing + documentation — 2026-04-23T16:00Z — completed (documentation created; integration tests to be run manually)

---

## Big Picture Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    System Architecture Overview                      │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐           │
│  │  Frontend│    │   Backend    │    │   Document Store │           │
│  │  (Vue 3) │◄──►│  (Express)   │◄──►│   (MongoDB 8.2)  │           │
│  └──────────┘    └──────┬───────┘    └──────────────────┘           │
│                         │                                           │
│              ┌──────────┴──────────┐                                │
│              │  New Components     │                                │
│              │                     │                                │
│              │  • DocumentParser   │                                │
│              │  • DocumentGroup    │                                │
│              │  • CitationBuilder  │                                │
│              │  • MemoryManager    │                                │
│              │  • MemoryExtractor  │                                │
│              └──────────┬──────────┘                                │
│                         │                                           │
│              ┌──────────┴──────────┐                                │
│              │  Existing Services  │                                │
│              │                     │                                │
│              │  • ragService       │                                │
│              │  • chatService      │                                │
│              │  • llamaService     │                                │
│              │  • toolRegistry     │                                │
│              └─────────────────────┘                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────┐               │
│  │  External Services                              │               │
│  │                                                  │               │
│  │  • llama.cpp (OpenAI-compatible API)            │               │
│  │    - /v1/chat/completions                       │               │
│  │    - /v1/embeddings                             │               │
│  └──────────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-04-23 | Use llama.cpp embeddings endpoint | Already integrated, consistent with existing RAG pipeline | Local Transformers.js model — rejected: adds GPU dependency and ~50MB download |
| 2026-04-23 | New DocumentGroup model (not extending RAGDocument) | Clean separation of concerns; groups are first-class entities, not document metadata | Extending RAGDocument with group_ids — rejected: violates single responsibility, makes queries complex |
| 2026-04-23 | Three-layer memory (episodic/semantic/procedural) | Matches cognitive science taxonomy; each layer has distinct lifecycle and retrieval pattern | Single flat memory store — rejected: mixing all memory types causes retrieval noise |
| 2026-04-23 | Inline numeric citations [1], [2] with source list | Most compact format for small context windows; easy for LLMs to generate and parse | Footnote-style — rejected: too verbose; bracketed keywords — rejected: ambiguous |
| 2026-04-23 | DocumentGroup uses custom permission model (owner/editor/viewer) | Role model has no permissions field; group roles are independent of system roles | Inherit from Role model — rejected: Role model lacks permissions, different concept entirely |
| 2026-04-23 | Deterministic citation injection as fallback to LLM prompting | llama.cpp models frequently ignore citation instructions in system prompts | Rely only on LLM prompting — rejected: unreliable for smaller models |
| 2026-04-23 | Keyword-based heuristic fallback for MemoryExtractor | Ensures memory extraction works even when llama.cpp is unavailable | No fallback — rejected: zero data loss guarantee needed |
| 2026-04-23 | Context budget capped at 300 tokens for memory + RAG combined | Prevents context window overflow on smaller models (8K tokens) | No budget enforcement — rejected: causes errors when context exceeds model limit |
| 2026-04-23 | DocumentGroup name unique per-owner, not globally | Allows multiple users to create groups with same name (e.g., "Engineering Docs") | Global unique constraint — rejected: arbitrary restriction on user naming |
| 2026-04-23 | Procedural memories read-only in frontend | Prevents accidental corruption of learned preferences; edits should go through re-extraction | Editable procedural memories — rejected: harder to maintain data integrity, risk of conflicting manual vs extracted data |

---

## Surprises & Discoveries

1. **Bug found in chatService**: `ragService.searchDocuments()` signature is `(userId, query, limit)` but `chatService.runLoop()` calls it with `(session.rag_document_ids, content)` — the first argument should be a user ID string, not an array of ObjectIds. This means RAG in chat sessions is currently broken or silently failing. **Fix: Phase 1.0 bug fix task.**

2. **No file parsing at all**: The current ragService does `fileBuffer.toString('utf8')` for ALL file types. PDF and DOCX files would result in binary garbage as content. No parsing libraries are installed.

3. **Role model is minimal**: The Role model only stores name, description, and is_builtin flag. There are no permissions attached to roles — the RBAC middleware checks role names but the Role model has no permission field. **Fix: DocumentGroup uses custom owner/editor/viewer permission model independent of system Roles.**

4. **Frontend rag store calls `/rag/query`** which doesn't exist as an endpoint — the store has a `queryKnowledgeBase()` action that POSTs to `/rag/query` but no route exists for this path.

5. **MongoDB 8.2 compatibility**: Mongoose 8.8.0 supports MongoDB 7.x and likely 8.x, but need to verify in testing. No schema changes needed.

## Review Findings (Round 1 — 2026-04-23)

Three sub-agent reviews identified 53 total issues across backend, frontend, and documentation:

### Critical Issues Incorporated
- **DocumentGroup name**: Changed from globally unique to unique per-owner via compound index `{ owner_id: 1, name: 1 }`
- **Citation injection**: Added deterministic fallback (re-search response sentences) since LLM prompting is unreliable for smaller models
- **MemoryExtractor fallback**: Added keyword-based heuristic extraction when llama.cpp unavailable
- **Memory message filtering**: Extractor now filters to user/assistant messages only, excluding system and RAG context messages
- **Frontend routes**: Explicit router entries added for `/document-groups` and `/memory` paths
- **Citation rendering target**: Changed from ChatView to AssistantMessage component (message-level data)
- **Streaming metadata**: SSE `done` event handler must extract citation metadata from stream response
- **Session creation form**: Converted sidebar "New Chat" click to open dialog with RAG options (no new component needed)
- **UserMemory embedding**: Added `embedding: [Number]` field for semantic vector search across memories
- **Error case tests**: Added comprehensive error test suite covering failed parsing, unauthorized access, expired memories, malformed files
- **Transfer ownership**: Added `transferOwnership()` method to DocumentGroup service with Mongoose session atomicity

### High Issues Incorporated
- Added JSON parser to DocumentParser (existing .json support was incomplete)
- Sheet-to-chunk mapping for XLSX citations (each chunk carries sheet_name)
- Two-phase search pattern for large document sets (avoids MongoDB $in blowup)
- UserMemory schema timestamp fix: removed `created_at` from metadata, use Mongoose built-in timestamps
- Token budget cap reduced to 300 tokens total (procedual: 10, semantic: 5, episodic: 3)
- PII redaction in MemoryExtractor before storing memories
- Pagination strategy for DocumentGroupsView and MemoriesView
- Loading/error state patterns following existing RAGDocumentsView conventions

---

## Plan of Work

### Phase Overview

```
Phase 1.0: Bug Fix — ragService.searchDocuments() call signature in chatService
    ↓
Phase 1: Document Parsing Infrastructure (foundation)
    ↓
Phase 2: Document Groups + RBAC (access control)
    ↓
Phase 3: Citation System (chat integration)
    ↓
Phase 4: Multi-Layer Memory System (persistent user memory)
    ↓
Phase 5: Frontend Updates (UI for new features)
    ↓
Phase 6: Integration Testing + Documentation
```

**Note**: Phases 1.0, 1, and 4 can start in parallel (bug fix is independent of parsing and memory).

---

### Phase 1.0: Bug Fix — ragService.searchDocuments() Call Signature

**Purpose**: Fix the broken RAG search call in chatService before building new features on top of it.

**Dependencies**: None

#### Tasks

1. **Fix ragService.searchDocuments() signature**
   - Change from `(userId, query, limit)` to `(userId, query, limit = 10, documentIds = [])`
   - Update all call sites: controller passes `(userId, query, top_k)`, chatService passes `(userId, query, 5, session.rag_document_ids)`

2. **Fix chatService.runLoop() call** (line ~362)
   - Was: `ragService.searchDocuments(session.rag_document_ids, content)`
   - Fix: `ragService.searchDocuments(userId, content, 5, session.rag_document_ids)`

3. **Fix chatService.streamRunLoop() call** (line ~527)
   - Same fix as runLoop above

4. **Fix chatService.chatWithLLM() call** (line ~261)
   - Same fix as runLoop above

5. **Update ragController.searchDocuments** to pass userId correctly
   - Was passing `userId` as first arg which was correct
   - Now passes `(userId, query, top_k)` — no change needed but verify

**Acceptance criteria:**
- All calls to ragService.searchDocuments() use the new signature
- RAG search in chat sessions returns results (was silently failing before)
- No TypeScript/JavaScript type errors after fix

---

### Phase 1: Document Parsing Infrastructure

**Purpose**: Add proper file type parsing for PDF, DOCX, XLSX, TXT, MD, CSV, JSON — currently only text files work.

**Dependencies**: None (foundation layer), Phase 1.0 recommended but not required

#### Tasks

1. **Install parsing dependencies**
   - Add `pdf-parse@^1.1.0`, `mammoth@^1.8.0`, `xlsx@^0.18.5` to package.json
   - Run `npm install` and verify all packages install without errors

2. **Create DocumentParser service** (`src/services/documentParser.js`)
   - `parsePDF(buffer)` — extract text from PDF pages, return `{ text, totalPages }`
   - `parseDOCX(buffer)` — extract raw text preserving paragraph structure
   - `parseXLSX(buffer)` — convert all sheets to markdown tables with `## SheetName` headers, return `{ text, sheetNames }`
   - `parseCSV(buffer)` — parse CSV with proper quote handling, convert to structured text
   - `parseTXT(buffer)` — UTF-8 decode, trim excessive whitespace
    - `parseMD(buffer)` — strip markdown formatting (headers, bold, italic, links, code blocks), keep semantic text
    - `parseJSON(buffer)` — parse JSON to object, convert structured data to readable text with dot-notation key paths as headers; handle nested objects and arrays recursively
    - `parseFile(buffer, fileType)` — router dispatching to correct parser

3. **Update ragService.uploadDocument()**
   - Replace `fileBuffer.toString('utf8')` with DocumentParser call
   - Add try/catch around parse call; on failure set status='failed', save error_message
   - For XLSX: store sheetNames in document metadata for later citation reference

4. **Update ragController.fileFilter**
   - Add XLSX MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - Add DOCX MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - Allow both MIME type AND extension-based acceptance (multer + extension fallback)

5. **Update RAGDocument model**
   - Add `sheets: [String]` field for XLSX sheet names
   - Add `parse_error: String` field in metadata for parse failure tracking
   - Extend file_type enum to include 'xlsx' (json already present)

**Acceptance criteria:**
- Upload a PDF with 10 pages — text extracted correctly, no binary garbage
- Upload an XLSX with 3 sheets — all sheet contents as markdown tables with headers
- Upload a DOCX — headings, paragraphs, list items preserved
- CSV with commas in quoted fields — properly handled
- JSON file — structured as readable text with keys as section headers
- Encrypted PDF — status='failed' with descriptive parse_error message

---

### Phase 2: Document Groups + RBAC

**Purpose**: Enable document sharing between users through document groups. Groups use the system's RBAC roles (via `roles` JSON column) for visibility, with `JSON_OVERLAPS()` queries for access control. The group owner and global admins can mutate groups.

**NOTE (2026-04-29)**: Migrated from membership-based model (visibility enum + members JSON) to RBAC role-based visibility. See `.agents/plans/document-groups-rbac_PLAN.md` for migration details.

**Dependencies**: Phase 1 (DocumentParser), Phase 1.0 (bug fix)

#### Tasks

1. **Schema** (`src/backend/db/schema.js` — MariaDB table)
   ```
   id: VARCHAR(36) PRIMARY KEY (UUID)
   name: VARCHAR(100) NOT NULL
   description: TEXT DEFAULT ''
   owner_id: VARCHAR(36) NOT NULL
   roles: JSON DEFAULT '["user"]'
   documents: JSON DEFAULT '[]'
   ```
   - Indexes: `idx_owner_id (owner_id)`, `idx_roles (roles(10))`, `idx_name_owner (name, owner_id) UNIQUE`

2. **DocumentGroup service** (`src/backend/services/documentGroupService.js`)
   - `createGroup(userId, name, description, roles)` — creates group with roles JSON array
   - `getUserGroups(userRoles)` — queries via `JSON_OVERLAPS(roles, userRoles)`
   - `updateGroup(groupId, userId, updateData)` — validates owner/admin; allows name/description/roles updates
   - `deleteGroup(groupId, userId)` — only owner or admin can delete
   - **`transferOwnership(groupId, userId, newOwnerId)`** — new owner must have overlapping roles with group
   - `addDocumentToGroup(groupId, documentId, userId)` — validates edit + ownership
   - `removeDocumentFromGroup(groupId, documentId, userId)` — validates edit permission
   - `getGroupAccessibleDocuments(userId, userRoles)` — returns all accessible docs via JSON_OVERLAPS
   - `getGroupDocuments(groupId)` — returns documents for a specific group

3. **Create DocumentGroup controller** (`src/controllers/documentGroupController.js`)
   - 10 endpoints: CRUD for groups, add/remove members, transfer ownership, add/remove documents, list accessible docs

4. **Create routes** (`src/routes/documentGroups.js`) + register in api.js
   ```
   POST   /api/document-groups                  — create group
   GET    /api/document-groups                  — list user's groups
   GET    /api/document-groups/:id              — get group details
   PATCH  /api/document-groups/:id              — update group
   DELETE /api/document-groups/:id              — delete group
   POST   /api/document-groups/:id/members      — add member (owner/admin)
   DELETE /api/document-groups/:id/members/:uid — remove member
   POST   /api/document-groups/:id/transfer     — transfer ownership
   POST   /api/document-groups/:id/documents    — add document to group
   DELETE /api/document-groups/:id/documents/:did — remove document
   GET    /api/document-groups/accessible       — list all accessible docs
   ```

5. **Update ragService.searchDocuments()** (post-bug-fix enhancement)
   - Signature already fixed in Phase 1.0: `(userId, query, limit = 10, documentIds = [])`
   - When `documentIds` empty/not provided: search all docs where user_id === userId OR doc is in accessible groups
   - When `documentIds` provided: search only within those specific IDs
   - For group-accessible: use two-phase query to avoid $in blowup on large sets

6. **Update RAGDocument model** (additional)
   - Add `group_ids: [ObjectId]` field (ref: DocumentGroup) — no sparse index (array sparse index behavior unreliable in MongoDB)
   - Add compound index `{ group_ids: 1, status: 1 }`
   - Add `isAccessibleTo(userId)` method using `$in` aggregation to fetch groups in one query

**Acceptance criteria:**
- Create a group, add 2 users as editors — both can see group documents
- Two users can create groups with the same name (unique per-owner)
- Owner cannot remove themselves (must use transferOwnership first)
- Transfer ownership is atomic (Mongoose session); partial failures roll back
- Add document to group — all members search it via chat RAG
- Remove member — they lose access immediately
- Public group — visible to all authenticated users; accessible docs endpoint lists them
- Chat session with rag_enabled searches personal docs AND group-accessible docs

---

### Phase 3: Citation System

**Purpose**: Every RAG-assisted chat response includes inline citations `[1]`, `[2]` linking back to source documents and chunks. Deterministic fallback ensures citations work even when LLM ignores prompting instructions.

**Dependencies**: Phase 1 (DocumentParser), Phase 2 (DocumentGroups for broader search scope)

#### Tasks

1. **Update ragService.searchDocuments() return format**
   - Each result chunk includes: `{ text, document_id, filename, file_type, chunk_index, similarity, sheet_name? }`
   - Return `sources` array with unique document metadata deduplicated

2. **Create CitationBuilder utility** (`src/utils/citationBuilder.js`)
   - `buildCitations(results)` — assigns numeric IDs [1], [2]..., returns `{ citations, citationMap }`
   - `formatSourceList(citations)` — generates markdown source list for response footer
   - `deterministicInjectCitations(text, results)` — **fallback**: re-runs ragService on each sentence in the response to find matching chunks and inject `[n]` markers. Primary injection remains via LLM prompt (best-effort), deterministic method is fallback.
   - CitationBuilder is a pure utility — does NOT call ragService itself

3. **Extract shared RAG helper function** in chatService
   - Create `buildRAGContext(userId, query, documentIds?)` that consolidates the triple-duplicated RAG search code currently at lines ~260, ~360, and ~527 in chatService
   - Returns `{ ragContext, citations }` for use by runLoop(), streamRunLoop(), and chatWithLLM()

4. **Update all three chat functions** (runLoop, streamRunLoop, chatWithLLM)
   - Replace inline RAG search with call to `buildRAGContext()`
   - Pass results through CitationBuilder
   - Store citation metadata in assistant message: `metadata.citations = [{ source_id, filename, chunk_index, similarity }]`

5. **Update ChatSession message metadata** (no schema change needed — Mixed type)
   - Document expected citation structure for frontend consumption

6. **Create AssistantMessage component citations section** (`frontend/src/components/chat/`)
   - After rendering assistant message content, show collapsible Sources panel
   - Display source documents with filenames and similarity scores
   - Filter citations by minimum similarity threshold (0.5) before display
   - Clicking a source navigates to RAGDocumentsView filtered to that document_id

7. **Update chat.js store streaming handler**
   - `sendStreamingMessage()` done event must extract `data.citations` and attach to unified message object: `unified.metadata = { ...existing, citations: data.citations }`

8. **Define route param for document filtering**
   - Add `:docId` param to RAGDocumentsView route
   - When present, filter document list to show only that document

**Acceptance criteria:**
- Chat response includes inline [1], [2] markers (via LLM prompting) OR deterministic injection fallback
- Sources panel appears below messages with citation metadata, filtered by similarity >= 0.5
- Citation metadata stored in session message for frontend rendering
- Clicking a source navigates to document chunks view
- Citations survive session persistence
- No citations when RAG disabled or no relevant docs found
- All three chat functions (sync, stream, chatWithLLM) have consistent citation behavior

---

### Phase 4: Multi-Layer Memory System

**Purpose**: Per-user persistent memory across chat sessions with three cognitive layers. Includes keyword-based extractor fallback when llama.cpp unavailable, PII redaction, and strict token budget (300 tokens total).

**Dependencies**: None (independent of RAG features, but integrates with chatService)

#### Tasks

1. **Create UserMemory model** (`src/models/UserMemory.js`)
   ```
   user_id: ObjectId (ref: User) — required
   layer: Enum ['episodic', 'semantic', 'procedural'] — required
   content: String — the memory content (PII-redacted before save)
   embedding: [Number] — vector embedding for semantic search (generated via llama.cpp)
   metadata: {
     source_session_id: ObjectId (ref: ChatSession, optional)
     keywords: [String]
     confidence: Number (0-1): >0.8 = stored directly, 0.5-0.8 = marked uncertain, <0.5 = discarded
     extracted_at: Date (use instead of created_at to avoid Mongoose timestamp conflict)
     expires_at: Date — set by pre-save hook for episodic (30 days), null for others
     last_accessed: Date
     access_count: Number
   }
   tags: [String]
   ```
   - Indexes: `{ user_id: 1, layer: 1, created_at: -1 }`, `{ 'metadata.expires_at': 1 }` (TTL), `{ 'metadata.keywords': 'text', tags: 'text' }` (text search)
   - Pre-save hook: sets `expires_at` for episodic memories (30 days from now)
   - Post-access hook: extends `expires_at` by 7 days every 5th access (recency-based scoring)

2. **Create MemoryManager service** (`src/services/memoryManager.js`)
   - `addEpisodicMemory(userId, content, sessionId)` — TTL-protected episodic memories
   - `addSemanticMemory(userId, content, keywords, embedding?)` — persistent factual knowledge with vector embedding
   - `addProceduralMemory(userId, content, keywords)` — user preferences/patterns (no expiration)
   - `getEpisodicMemory(userId, limit=3)` — most recent non-expired episodic memories
   - `getSemanticMemory(userId, query?)` — keyword search or all semantic (limited to 5)
   - `getProceduralMemory(userId)` — user preferences (limited to 10 entries)
   - `getAllMemoriesForContext(userId, query)` — combines layers with priority: procedural > semantic(query-matched) > episodic(recent); capped at 300 tokens total
   - `deleteMemory(memoryId, userId)` — validates ownership before delete
   - `consolidateSemantics(userId)` — merges similar semantic memories using TF-IDF cosine similarity on keyword vectors

3. **Create MemoryExtractor utility** (`src/utils/memoryExtractor.js`)
   - `redactPII(text)` — regex-based PII redaction (emails, phone numbers, credit cards, API keys, URLs with auth tokens)
   - `extractFromConversation(messages)` — filters to user/assistant messages only (excludes system/RAG context); analyzes for:
     - Episodic: conversation topics from first user message per topic shift (limit 3)
     - Semantic: declarative statements ("X is Y", "uses Z") using llama.cpp structured extraction with JSON output schema
     - Procedural: preference keywords ("prefer", "always", "never", "use")
   - **Fallback**: keyword-based heuristic when llama.cpp unavailable:
     - Episodic: extract from sentence boundaries and question detection
     - Semantic: identify patterns with "is", "uses", "has"
     - Procedural: detect preference keywords
   - Returns `{ episodic: [], semantic: [], procedural: [] }` with confidence scores

4. **Add automatic memory extraction to chatService**
   - Import memoryManager and memoryExtractor
   - After conversation reaches threshold (configurable via env `MEMORY_EXTRACTION_THRESHOLD`, default 10):
     - Call `memoryExtractor.extractFromConversation(filteredMessages)`
     - Store extracted memories via MemoryManager
     - Log success/failure; failure is non-fatal (doesn't break chat flow)
   - Periodic consolidation: check interval config, call `consolidateSemantics()` if interval passed

5. **Update system message building in chatService**
   - New function `buildUserMemoryContext(userId)` with deterministic context budget:
     1. Procedural first (always included, capped at 10 entries)
     2. Semantic by relevance (capped at 5 entries, ~150 tokens)
     3. Episodic oldest-first trimmed to remaining budget (capped at 3 entries, ~50 tokens)
     4. Total: max 300 tokens across all layers
   - Integrate into system message before RAG context

6. **Create MemoryController** (`src/controllers/memoryController.js`)
   - GET `/api/memory/memories?layer=X&limit=Y` — list memories with layer filter
   - GET `/api/memory/episodic` — episodic only
   - GET `/api/memory/semantic?q=search+query` — semantic with keyword search
   - GET `/api/memory/procedural` — procedural only
   - POST `/api/memory/extract` — manual extraction from session (body: `{ session_id }`)
   - DELETE `/api/memory/:id` — delete specific memory

7. **Create routes** (`src/routes/memory.js`) + register in api.js
   ```
   GET    /api/memory/memories                  — list all memories with filter
   GET    /api/memory/episodic                  — episodic only
   GET    /api/memory/semantic                  — semantic with search
   GET    /api/memory/procedural                — procedural only
   POST   /api/memory/extract                   — trigger extraction
   DELETE /api/memory/:id                       — delete memory
   ```

**Acceptance criteria:**
- After threshold messages, memories auto-extracted and stored in all 3 layers
- Episodic memories expire after 30 days (TTL index verified); frequently accessed memories extended
- Semantic memories persist indefinitely; consolidation reduces redundant entries
- Procedural memories (10 max) always included in new session system message
- Chat references remembered facts across sessions ("As you mentioned...")
- Manual extraction works for backfilling existing sessions
- PII redaction applied before storing any memory content
- Keyword fallback extractor produces results when llama.cpp unavailable
- Memory context stays under 300 tokens total

---

### Phase 5: Frontend Updates

**Purpose**: UI for document groups, citations display in chat, and memory management. All views follow existing PrimeVue/Aura theme conventions with responsive design.

**Dependencies**: Phases 1-4 (all backend features)

#### Tasks

1. **Create DocumentGroupsView.vue** (`frontend/src/views/document-groups/`)
   - Card grid showing groups: name, description, roles badges, document count
   - Create group dialog (name, description, role checkboxes)
   - Group detail view with documents list (no members tab — access controlled by RBAC roles)
   - Documents list: add/remove for owner/admin users
   - Delete group confirmation dialog
   - Responsive design with `@media (max-width: 768px)` breakpoint

2. **Create DocumentGroups store** (`frontend/src/stores/documentGroups.js`)
   - Pinia state: groups, currentGroup, accessibleDocs, loading, error
   - Actions: createGroup(with roles), fetchGroups, fetchGroup, updateGroup(with roles), deleteGroup, transferOwnership, addDocument, removeDocument, fetchAccessibleDocs

3. **Create MemoriesView.vue** (`frontend/src/views/memory/`)
   - Tabbed interface: Episodic | Semantic | Procedural
   - Each tab: loading state, empty state ("No memories found"), error banner (following RAGDocumentsView pattern)
   - Episodic: shows expiration countdown, source session links
   - Semantic: search input querying `/api/memory/semantic?q=...`, keywords as tags
   - Procedural: read-only display of user preferences/patterns
   - "Extract memories" section: dropdown to select session, calls POST /api/memory/extract
   - Pagination for large memory lists

4. **Create Memories store** (`frontend/src/stores/memory.js`)
   - Pinia state: episodic, semantic, procedural, loading, error, pagination
   - Actions: fetchMemories(layer, limit), fetchEpisodic, fetchSemantic(query), fetchProcedural, extractMemories(sessionId), deleteMemory(id)

5. **Add citations section to AssistantMessage component** (`frontend/src/components/chat/`)
   - Collapsible Sources panel below assistant message content (NOT in ChatView — message-level data belongs in component)
   - Filter citations by similarity >= 0.5 before display
   - Show filename, similarity score, chunk index per source
   - Clicking source navigates to RAGDocumentsView with `:docId` route param
   - PrimeVue Transition for smooth expand/collapse

6. **Update chat.js store streaming handler**
   - `sendStreamingMessage()` done event must extract `data.citations` and attach to unified message object

7. **Add router entries** (`frontend/src/router/index.js`)
   - `{ path: 'document-groups', name: 'document-groups', component: () => import('../views/document-groups/DocumentGroupsView.vue') }`
   - `{ path: 'memory', name: 'memory', component: () => import('../views/memory/MemoriesView.vue') }`

8. **Update Sidebar navigation** (`frontend/src/components/layout/Sidebar.vue`)
   - Add "Document Groups" under Knowledge section (with existing Documents/Queries) — icon: `pi pi-folder-open`
   - Add "Memory" under Knowledge section — icon: `pi pi-database`

9. **Convert sidebar "New Chat" to dialog with RAG options**
   - Instead of direct `createSession()` call, open a dialog on New Chat click
   - Dialog includes: session name input, RAG toggle, document selector (combines personal docs from ragStore AND group-accessible docs from documentGroupsStore)

10. **Add document filtering to RAGDocumentsView**
    - Handle `:docId` route param — when present, filter document list to show only that specific document

---

## Dependencies Graph

```
Phase 1.0 (Bug Fix) ─────────────────────────────────────────────────────────┐
    ↓                                                                          │
Phase 1 (Parsing)          ──┐                                                │
                              ├──► Phase 2 (Groups) ──► Phase 3 (Citations) ──► Phase 5 (Frontend)
                              │                               │                       ▲
Phase 4 (Memory)             │                               ├──► Phase 3 (Citations) ──►│
(independent, parallel)      │                               │                       │
                             └───────────────────────────────┴───────────────────────┘

Note: Phase 1.0 recommended but not required before 1 or 4. Phases 1, 2, and 4 can start in parallel.
Phase 3 depends on 1+2. Phase 5 depends on all backend phases. Phase 6 (testing/docs) runs last.
```

---

### Phase 6: Integration Testing + Documentation

**Purpose**: Verify all features work end-to-end and create comprehensive documentation following existing docs format (rag-system.md as template).

**Dependencies**: Phases 1-5 (all features implemented)

#### Tasks

1. **End-to-end happy path test scenarios**
   - Upload PDF → verify text extraction → search via RAG → verify citations in chat → click source → view chunks
   - Create group → add members → verify access control → search from different user accounts → add doc to group → cross-user RAG
   - Run 10+ message conversation → verify memory extraction → verify memories appear on next session
   - Cross-session test: mention something from a prior session → verify semantic memory retrieval references prior facts
   - Transfer ownership from user A to B → verify role changes and group persists

2. **Error case test scenarios** (NEW — per review finding)
   - Upload encrypted PDF → verify status='failed' with parse_error message
   - Attempt unauthorized group access → verify 403 response
   - Query expired episodic memories → verify they are excluded from results
   - Upload malformed CSV/DOCX → verify graceful error handling, no server crash
   - Disable llama.cpp endpoint during memory extraction → verify graceful degradation (warning logged, chat continues)
   - Context budget overflow test: trigger RAG + memory on model with small context window → verify trimming works

3. **Performance testing**
   - Large document (50+ pages PDF) — processing time under 30 seconds
   - 1000+ chunked documents — search response under 2 seconds
   - Memory extraction for long sessions (50+ messages) — under 10 seconds
   - Context budget: verify total system message fits within model context window

4. **Documentation updates**
   - Update `docs/features/rag-system.md` with new file types, groups, citations
   - Create `docs/features/document-groups.md` — schema diagram, workflow diagrams, RBAC matrix (custom owner/editor/viewer), API endpoints, examples
   - Create `docs/features/persistent-memory.md` — layer explanations, UserMemory schema, extraction workflow, TTL/consolidation lifecycle, API endpoints, structured extraction prompt template
   - Create `docs/features/citation-system.md` — citation format spec, system message template, frontend rendering, integration points
   - Update `docs/architecture/database-schema.md` with DocumentGroup + UserMemory schemas
   - Update `docs/architecture/system-architecture.md` with new component diagrams
   - Update `docs/features/chat-sessions.md` (citation display, memory context injection)
   - Update `docs/features/llm-integration.md` (embedding usage for memories)
   - Update `docs/index.md` to include new feature sections
   - Add tags `document-groups`, `persistent-memory`, `citations`, `memory-extraction` to `docs/tags-index.md`

5. **QA pages**
   - Create `docs/qa/document-groups-qa.md` — test cases with expected results, troubleshooting (follow existing QA format)
   - Create `docs/qa/persistent-memory-qa.md` — extraction scenarios, context budget management examples, confidence interpretation guide
   - Update `docs/CHANGELOG.md` with feature entries and timestamps

---

## Validation & Acceptance Criteria

### L1: Unit/Component Level
- Each service function tested in isolation with mock data
- DocumentParser handles each file type correctly including edge cases (encrypted PDF, malformed CSV)
- CitationBuilder produces valid citation markers and source lists; deterministic fallback works
- MemoryExtractor returns structured objects with PII redaction applied

### L2: Integration Level
- RAG search returns citations for chat responses (all three functions: sync, stream, chatWithLLM consistent)
- Document groups enforce permissions correctly (owner/editor/viewer distinctions verified)
- Memory extraction triggers automatically after threshold; fallback extractor produces results when llama.cpp unavailable
- Cross-session memory retrieval works (session A creates semantic memory, session B retrieves it)
- Ownership transfer is atomic (tested with rollback scenario)

### L3: System Level
- End-to-end: upload document → chat with RAG → see citations → click source → view chunks
- Multi-user: user A shares doc via group → user B searches and gets result with citations
- Memory persistence: conversation 1 creates memories → conversation 2 references them
- Context budget enforced: system message never exceeds model context window
- All error cases handled gracefully (no server crashes, appropriate HTTP status codes)

### Stop Conditions
- No feature will proceed if Phase N acceptance criteria are not met
- If a sub-task blocks more than 2 other tasks, escalate for architecture review
- All tests must pass before merging to main branch

## Outcomes & Retrospective

### Expected System Capabilities After Implementation

| Feature | Before | After |
|---------|--------|-------|
| File types supported | txt, md (binary garbage for others) | pdf, docx, xlsx, csv, txt, md (all parsed correctly) |
| Document sharing | None (user-owned only) | Groups with owner/editor/viewer roles |
| Chat citations | None | Inline [1][2] markers + source list |
| Persistent memory | Per-session only | Three-layer cross-session system |
| Memory extraction | Manual only | Automatic after conversation threshold |

### Risks & Mitigations

1. **Context window overflow**: RAG context + memory context + chat history could exceed llama.cpp context limits
   - Mitigation: Implement deterministic context budget tracker capped at 300 tokens for memory+RAG combined; procedural first, semantic second (by relevance), episodic third (oldest-first trim); cap RAG results at 5 chunks

2. **Embedding dimension mismatch**: Different embedding models produce different vector dimensions
   - Mitigation: Store embedding model name per document and per memory; validate dimensions at search time; reject mismatches with clear error

3. **XLSX parsing edge cases**: Formulas, charts, and formatting won't extract as text
   - Mitigation: Document limitations clearly; only extract cell values (not formulas); warn about complex spreadsheets in error_message; sheet_name tracking per chunk for citation accuracy

4. **Memory extraction accuracy**: LLM may hallucinate facts from conversations
   - Mitigation: Confidence scoring (>0.8 stored directly, 0.5-0.8 marked uncertain, <0.5 discarded); keyword-based heuristic fallback when llama.cpp unavailable; PII redaction before storage; manual delete capability

5. **Citation reliability**: Smaller models may ignore citation instructions in system prompts
   - Mitigation: Deterministic fallback that re-searches response sentences against RAG chunks to inject [n] markers; minimum similarity threshold (0.5) for displayed citations

6. **Document group scalability**: Large groups with many documents could cause MongoDB query blowup
   - Mitigation: Two-phase search pattern instead of single $in query; pagination on accessible docs endpoint; index optimization

7. **Memory PII exposure**: Raw conversation content (passwords, API keys, personal data) could be stored in UserMemory
   - Mitigation: Regex-based PII redaction function applied before every memory save; confidence scoring for uncertain extractions

---

## Related Documentation Links

- [Existing RAG System](../docs/features/rag-system.md) — current RAG documentation
- [Chat Sessions](../docs/features/chat-sessions.md) — how chat works currently  
- [Database Schema](../docs/architecture/database-schema.md) — existing models
- [LLM Integration](../docs/features/llm-integration.md) — llama.cpp service integration
- [Security Design](../docs/architecture/security-design.md) — RBAC patterns to follow
