# RAG Operations & Per-User Persistent Memory — Summary & Documentation Index

**Created**: 2026-04-23  
**Status**: Plan complete, ready for implementation  
**Review**: Round 1 completed (53 issues identified and fixed)  

---

## Executive Summary

This plan extends the existing LLM Server with four major features targeting local llama.cpp deployments with limited context windows:

1. **Document Parsing Infrastructure** — Proper text extraction from PDF, DOCX, XLSX, CSV, TXT, MD, JSON (replacing broken `toString('utf8')` approach)
2. **Document Groups + RBAC** — Custom owner/editor/viewer permission model for cross-user document sharing (independent of system Roles which lack permissions)
3. **Citation System** — Inline [1], [2] markers with deterministic fallback injection and source list display in chat responses
4. **Multi-Layer Persistent Memory** — Three-layer cognitive memory (episodic/semantic/procedural) per user, auto-extracted after conversation threshold, with keyword-based extractor fallback when llama.cpp unavailable

### Key Design Decisions

- **Context budget**: 300 tokens max for memory + RAG combined; procedural first, semantic by relevance, episodic oldest-first
- **Citations**: LLM prompt (best-effort) + deterministic sentence re-search fallback
- **Document groups**: Custom permission model (owner/editor/viewer), not system Roles
- **Memory extraction**: llama.cpp structured JSON output + keyword heuristic fallback
- **PII redaction**: Regex-based before every memory save

### Review Findings Summary

Three sub-agent reviews identified **53 total issues** across backend, frontend, and documentation:
- 13 Critical (incorporated into plan)
- 18 High (incorporated into plan)
- MEDIUM/LOW findings documented in review notes

---

## Documentation File Index

### Strategic Layer (Overview & Planning)

| File | Description |
|------|-------------|
| [.agents/plans/execution-plan.md](./plans/execution-plan.md) | **Main execution plan** — Purpose, phases, tasks, validation criteria, dependencies graph |
| [.agents/plans/tmp/consolidated-todos.md](./plans/tmp/consolidated-todos.md) | Quick reference — all new files to create, modified files, dependencies |

### Tactical Layer (Phase Plans)

| File | Description |
|------|-------------|
| [.agents/plans/tmp/phase1-todo.md](./plans/tmp/phase1-todo.md) | Phase 1: Document parsing infrastructure — 5 detailed tasks with acceptance criteria |
| [.agents/plans/tmp/phase2-todo.md](./plans/tmp/phase2-todo.md) | Phase 2: Document groups + RBAC — 6 detailed tasks covering models, services, controllers, routes |
| [.agents/plans/tmp/phase3-todo.md](./plans/tmp/phase3-todo.md) | Phase 3: Citation system — 5 tasks for back-end citation building and frontend display |
| [.agents/plans/tmp/phase4-todo.md](./plans/tmp/phase4-todo.md) | Phase 4: Multi-layer memory system — 7 detailed tasks for models, services, extractors, routes |
| [.agents/plans/tmp/phase5-todo.md](./plans/tmp/phase5-todo.md) | Phase 5: Frontend updates — 7 tasks covering views, stores, routing, chat integration |
| [.agents/plans/tmp/phase6-todo.md](./plans/tmp/phase6-todo.md) | Phase 6: Integration testing + documentation — test scenarios, performance tests, doc updates |

### Discovery & Review Notes

| File | Description |
|------|-------------|
| [.agents/notes/discoveries.md](./notes/discoveries.md) | **Codebase analysis** — current RAG system status, gaps vs requirements, existing infrastructure to leverage |
| [.agents/notes/review-findings-round1.md](./notes/review-findings-round1.md) | **Round 1 review** — 53 issues from 3 sub-agent reviews with severity levels and fixes applied |

### Existing Codebase (Reference for Implementation)

| File | Description |
|------|-------------|
| `src/models/RAGDocument.js` | Existing RAG document model (will be extended with group_ids, sheets, parse_error) |
| `src/services/ragService.js` | Existing RAG service (bug fix needed in searchDocuments call signature) |
| `src/services/chatService.js` | Chat service (RAG integration points for citations + memory context) |
| `src/models/ChatSession.js` | Chat session model (message metadata extended for citations) |
| `src/models/User.js` | User model (will have UserMemory references via memoryManager) |
| `src/middleware/rbac.js` | Existing RBAC middleware (authorize(), requireAdmin()) |
| `frontend/src/stores/rag.js` | Existing RAG Pinia store (pattern reference for new stores) |
| `frontend/src/views/rag/RAGDocumentsView.vue` | Existing RAG documents view (style/pattern reference) |

### Documentation to Create (Post-Implementation)

| File | Description | Phase |
|------|-------------|-------|
| `docs/features/document-groups.md` | Document groups feature docs — schema, workflows, RBAC matrix, API endpoints | Phase 6 |
| `docs/features/persistent-memory.md` | Persistent memory feature docs — layer explanations, extraction workflow, prompt template | Phase 6 |
| `docs/features/citation-system.md` | Citation system docs — format spec, system message template, integration points | Phase 6 |
| `docs/qa/document-groups-qa.md` | QA test cases and troubleshooting for document groups | Phase 6 |
| `docs/qa/persistent-memory-qa.md` | QA extraction scenarios and context budget examples for memory | Phase 6 |

### Existing Documentation (To Update)

| File | Description | Changes Needed |
|------|-------------|----------------|
| `docs/features/rag-system.md` | Current RAG docs | Add xlsx support, document groups, citation system updates |
| `docs/architecture/database-schema.md` | Database schema diagrams | Add DocumentGroup + UserMemory schemas |
| `docs/architecture/system-architecture.md` | System architecture diagrams | Add group flow and memory system components |
| `docs/features/chat-sessions.md` | Chat session docs | Citation display, memory context injection |
| `docs/features/llm-integration.md` | LLM integration docs | Embedding usage for memories |
| `docs/index.md` | Main documentation index | Add Document Groups, Persistent Memory, Citation System sections |
| `docs/tags-index.md` | Tag-based navigation | Add tags: document-groups, persistent-memory, citations, memory-extraction |
| `docs/CHANGELOG.md` | Change history | Feature entries with timestamps |

---

## Implementation Order (Recommended)

```
Week 1: Phase 1.0 (bug fix) + Phase 1 (parsing) + Phase 4 start (models)
Week 2: Phase 2 (groups) + Phase 4 continue (services, extractor)
Week 3: Phase 3 (citations) + Phase 4 finish (memory integration)
Week 4: Phase 5 (frontend) + Phase 6 (testing + docs)
```

**Parallel tracks**: Phases 1, 2, and 4 can start in parallel after Phase 1.0 bug fix. Phase 3 depends on both 1 and 2 being complete. Phase 5 depends on all backend phases. Phase 6 runs last.

---

## All New Files Summary (Backend)

```
src/models/DocumentGroup.js          — Document group model with ownership, membership, visibility
src/models/UserMemory.js             — Persistent memory model with 3 layers, embeddings, TTL
src/services/documentParser.js       — PDF/DOCX/XLSX/CSV/TXT/MD/JSON parsers
src/services/documentGroupService.js — Group CRUD + access control + transferOwnership
src/services/memoryManager.js        — Memory CRUD + retrieval + consolidation
src/utils/citationBuilder.js         — Citation ID assignment, source list formatting, deterministic injection
src/utils/memoryExtractor.js         — Auto-extract memories from conversations + PII redaction + keyword fallback
src/controllers/documentGroupController.js  — 10 REST endpoints for group management
src/controllers/memoryController.js        — 6 REST endpoints for memory management
src/routes/documentGroups.js                 — Document groups routes (auth protected)
src/routes/memory.js                       — Memory routes (auth protected)

Modified:
src/models/RAGDocument.js            — Add: sheets, parse_error, group_ids fields + indexes
src/services/ragService.js           — Fix signature + add group-accessible search + sheet tracking
src/services/chatService.js          — Extract shared RAG helper + citation integration + memory context
src/controllers/ragController.js     — Add XLSX/DOCX MIME types + dual MIME/extension acceptance

Dependencies to add:
package.json                         — pdf-parse, mammoth, xlsx
```

## All New Files Summary (Frontend)

```
frontend/src/stores/documentGroups.js — Document groups Pinia store with pagination
frontend/src/stores/memory.js         — Memory Pinia store with layer filtering and search
frontend/src/views/document-groups/DocumentGroupsView.vue  — Group management UI
frontend/src/views/memory/MemoriesView.vue                 — Three-layer memory browsing UI

Modified:
frontend/src/components/chat/AssistantMessage.vue   — Add citations section
frontend/src/router/index.js                        — Add /document-groups and /memory routes
frontend/src/components/layout/Sidebar.vue          — Add Knowledge section items
frontend/src/views/chat/ChatView.vue (or store)     — Convert New Chat to dialog with RAG options
frontend/src/stores/chat.js                         — Update streaming done handler for citations
frontend/src/views/rag/RAGDocumentsView.vue         — Add :docId route param filtering
```

---

## Review Round 1: Key Fixes Applied

### Critical Fixes (13 issues)
- DocumentGroup name: unique per-owner via compound index `{ owner_id: 1, name: 1 }`
- Citation injection: deterministic fallback added (re-search response sentences)
- MemoryExtractor: keyword-based heuristic fallback when llama.cpp unavailable
- Message filtering: extractor filters to user/assistant messages only
- Frontend routes: explicit router entries for new paths
- Citation rendering: moved from ChatView to AssistantMessage component
- Streaming metadata: SSE done handler extracts citation data
- Session creation: converted sidebar click to dialog (no new component)
- UserMemory embedding: added vector field for semantic search
- Error tests: comprehensive error case test suite added
- Transfer ownership: added with Mongoose session atomicity
- JSON parser: added to DocumentParser (existing .json support was broken)
- Sheet-to-chunk mapping: XLSX chunks carry sheet_name for citation accuracy

### High Fixes (18 issues)
- Token budget cap reduced to 300 tokens total
- UserMemory schema timestamp conflict resolved (use extracted_at instead of created_at)
- Two-phase search pattern for large document sets
- PII redaction before memory storage
- Pagination strategy for all new views
- Loading/error state patterns following existing conventions
- Procedural memories set as read-only
- Context budget algorithm defined (procedual > semantic > episodic)

---

## Next Steps for Human Review

1. **Read** [.agents/plans/execution-plan.md](./plans/execution-plan.md) for the complete plan
2. **Review** [.agents/notes/review-findings-round1.md](./notes/review-findings-round1.md) for issues found during sub-agent review
3. **Validate** phase todo lists in [.agents/plans/tmp/](./plans/tmp/) match the execution plan
4. **Approve** or request changes before implementation begins

### Questions for Human Reviewer

1. Is the 300-token context budget appropriate for your target models? (Currently optimized for 8K-32K window models)
2. Should procedural memories be editable in the frontend, or remain read-only?
3. Do you want a public group browsing endpoint (`GET /api/document-groups/public`) for discoverability?
4. Is the MEMORY_EXTRACTION_THRESHOLD default of 10 messages appropriate, or should it be different?
5. Any additional file types beyond PDF, DOCX, XLSX, CSV, TXT, MD, JSON that need support?
