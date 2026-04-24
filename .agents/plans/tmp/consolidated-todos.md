# Consolidated Phase Todo Lists

All detailed todo lists are in `.agents/plans/tmp/`:

| Phase | File | Status |
|-------|------|--------|
| Phase 1.0: Bug Fix | `tmp/phase1.0-todo.md` | ✅ Completed |
| Phase 1: Document Parsing Infrastructure | `tmp/phase1-todo.md` | ✅ Completed |
| Phase 2: Document Groups + RBAC | `tmp/phase2-todo.md` | ✅ Completed |
| Phase 3: Citation System | `tmp/phase3-todo.md` | ✅ Completed |
| Phase 4: Multi-Layer Memory System | `tmp/phase4-todo.md` | ✅ Completed |
| Phase 5: Frontend Updates | `tmp/phase5-todo.md` | ✅ Completed |
| Phase 6: Integration Testing + Documentation | `tmp/phase6-todo.md` | ⚠️ Docs created, tests pending manual run |

Main execution plan: `.agents/plans/execution-plan.md`  
Cross-reference log: `.agents/notes/cross-reference-log.md`

---

## Implementation Summary (2026-04-23)

All 6 phases implemented. Key deliverables:

### Backend New Files
```
src/models/DocumentGroup.js          ✅ Created
src/models/UserMemory.js             ✅ Created
src/services/documentParser.js       ✅ Created
src/services/documentGroupService.js ✅ Created
src/services/memoryManager.js        ✅ Created
src/utils/citationBuilder.js         ✅ Created
src/utils/memoryExtractor.js         ✅ Created
src/controllers/documentGroupController.js  ✅ Created
src/controllers/memoryController.js        ✅ Created
src/routes/documentGroups.js                 ✅ Created
src/routes/memory.js                       ✅ Created
```

### Frontend New Files
```
frontend/src/stores/documentGroups.js   ✅ Created
frontend/src/stores/memory.js           ✅ Created
frontend/src/views/document-groups/DocumentGroupsView.vue  ✅ Created
frontend/src/views/memory/MemoriesView.vue                 ✅ Created
```

### Documentation New Files
```
docs/features/document-groups.md      ✅ Created
docs/features/persistent-memory.md    ✅ Created
docs/features/citation-system.md      ✅ Created
```

### Modified Files (Key Changes)
- `src/services/ragService.js` — Bug fix + parsing integration + group search + citation format
- `src/services/chatService.js` — Memory context injection + automatic extraction + citations
- `src/models/RAGDocument.js` — Added xlsx, sheets, parse_error, group_ids
- `frontend/src/stores/chat.js` — Citation metadata extraction in streaming
- `frontend/src/router/index.js` — Added /document-groups, /memory routes
- `frontend/src/components/layout/Sidebar.vue` — Added nav items for groups + memory
- All existing docs updated with new features

---

## Quick Reference: All New Files to Create

### Backend (src/)
```
src/models/DocumentGroup.js          — Document group model
src/models/UserMemory.js             — Persistent memory model
src/services/documentParser.js       — File type parsers
src/services/documentGroupService.js — Group CRUD + access control
src/services/memoryManager.js        — Memory CRUD and retrieval
src/utils/citationBuilder.js         — Citation formatting
src/utils/memoryExtractor.js         — Auto-extract memories from conversations
src/controllers/documentGroupController.js
src/controllers/memoryController.js
src/routes/documentGroups.js
src/routes/memory.js
```

### Backend (src/) — Modified Existing Files
```
src/models/RAGDocument.js            — Add: sheets, parse_error, group_ids fields
src/services/ragService.js           — Fix searchDocuments signature, add group support
src/services/chatService.js          — Add memory context + citation integration
src/controllers/ragController.js     — Add XLSX/DOCX MIME types to fileFilter
```

### Frontend (frontend/src/) — New Files
```
frontend/src/stores/documentGroups.js — Document groups Pinia store
frontend/src/stores/memory.js         — Memory Pinia store
frontend/src/views/document-groups/DocumentGroupsView.vue
frontend/src/views/memory/MemoriesView.vue
```

### Frontend (frontend/src/) — Modified Existing Files
```
frontend/src/components/chat/AssistantMessage.vue   — Add citations section (message-level)
frontend/src/router/index.js                        — Add /document-groups and /memory routes
frontend/src/components/layout/Sidebar.vue          — Add nav items for groups + memory
frontend/src/views/rag/RAGDocumentsView.vue         — Add :docId route param filtering
frontend/src/stores/chat.js                         — Update streaming done handler for citations
```

### Phase 1.0 (Bug Fix) — Added
```
.agents/plans/tmp/phase1.0-todo.md — Fixed ragService.searchDocuments() call signature bug
```

### Documentation (docs/)
```
docs/features/document-groups.md      — New feature documentation
docs/features/persistent-memory.md    — New feature documentation
docs/features/citation-system.md      — New feature documentation
docs/qa/document-groups-qa.md         — QA test cases
docs/qa/persistent-memory-qa.md       — QA test cases
```

### Documentation (docs/) — Modified Existing Files
```
docs/features/rag-system.md           — Update with new file types, groups, citations
docs/architecture/database-schema.md  — Add DocumentGroup + UserMemory schemas
docs/architecture/system-architecture.md — Update diagrams
docs/tags-index.md                    — Add new tags
```

### Dependencies (package.json)
```
+ pdf-parse@^1.1.0
+ mammoth@^1.8.0
+ xlsx@^0.18.5
```
