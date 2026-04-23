# Consolidated Phase Todo Lists

All detailed todo lists are in `.agents/plans/tmp/`:

| Phase | File | Status |
|-------|------|--------|
| Phase 1: Document Parsing Infrastructure | `tmp/phase1-todo.md` | Draft |
| Phase 2: Document Groups + RBAC | `tmp/phase2-todo.md` | Draft |
| Phase 3: Citation System | `tmp/phase3-todo.md` | Draft |
| Phase 4: Multi-Layer Memory System | `tmp/phase4-todo.md` | Draft |
| Phase 5: Frontend Updates | `tmp/phase5-todo.md` | Draft |
| Phase 6: Integration Testing + Documentation | `tmp/phase6-todo.md` | Draft |

Main execution plan: `.agents/plans/execution-plan.md`

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

### Frontend (frontend/src/)
```
frontend/src/stores/documentGroups.js — Document groups Pinia store
frontend/src/stores/memory.js         — Memory Pinia store
frontend/src/views/document-groups/DocumentGroupsView.vue
frontend/src/views/memory/MemoriesView.vue
```

### Frontend (frontend/src/) — Modified Existing Files
```
frontend/src/stores/rag.js            — Update search to use new citation format
frontend/src/views/chat/ChatView.vue  — Add citations display panel
frontend/src/components/layout/Sidebar.vue — Add nav items for groups + memory
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
