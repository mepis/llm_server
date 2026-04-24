# Cross-Reference Update Log — 2026-04-23

This log documents all cross-references between documents and changes made to ensure consistency.

---

## Changes Made During Final Review Cycle (2026-04-23T12:00Z)

### 1. Phase 1.0 Bug Fix Todo — Created
**File**: `.agents/plans/tmp/phase1.0-todo.md` (NEW)
- Was referenced in execution-plan.md but no dedicated todo file existed
- Now has its own detailed task list matching execution-plan Section "Phase 1.0"

### 2. Citation Rendering Target — Aligned
**Issue**: Some docs said ChatView, review findings said AssistantMessage
**Fixes applied to:**
- `.agents/plans/tmp/phase3-todo.md` Task 3.5: Changed target from `ChatView.vue` to `AssistantMessage.vue` with rationale
- `.agents/plans/tmp/consolidated-todos.md`: Updated frontend modified files list to reference `AssistantMessage.vue` instead of `ChatView.vue`
- `.agents/plans/execution-plan.md`: Already correct (says "Create AssistantMessage component citations section")

### 3. JSON Parser — Added to Phase 1
**Issue**: Review finding #12 identified missing JSON parser in DocumentParser
**Fixes applied to:**
- `.agents/plans/tmp/phase1-todo.md` Task 1.2: Added `parseJSON(buffer)` sub-task with detailed requirements
- `.agents/plans/execution-plan.md` Phase 1 Task 1.2: Expanded description for JSON parser

### 4. UserMemory TTL Extension — Added
**Issue**: Review finding identified access_count-based TTL extension was needed but not specified
**Fixes applied to:**
- `.agents/plans/tmp/phase4-todo.md` Task 4.1: Added recency-based TTL extension to `recordAccess()` method description
- Added post-find hook to auto-record access on every query

### 5. Consolidated Todos — Fixed Categorization
**Issue**: `frontend/src/stores/rag.js` listed under "Backend (src/) Modified Existing Files" but is frontend
**Fixes applied to:**
- `.agents/plans/tmp/consolidated-todos.md`: Moved all frontend files to correct sections, added section headers

### 6. Execution Plan Progress — Timestamped
**Issue**: Progress checkboxes had dates without timestamps
**Fixes applied to:**
- `.agents/plans/execution-plan.md`: Added ISO 8601 timestamps to all completed items, added new review cycle items

---

## Cross-Reference Map

### What documents what?

| Topic | Primary Doc | Supporting Docs |
|-------|-------------|-----------------|
| Overall plan architecture | execution-plan.md | summary-index.md |
| Phase 1.0 bug fix | phase1.0-todo.md | execution-plan.md §Phase 1.0, consolidated-todos.md |
| Document parsing | phase1-todo.md | execution-plan.md §Phase 1, consolidated-todos.md |
| Document groups + RBAC | phase2-todo.md | execution-plan.md §Phase 2, consolidated-todos.md |
| Citation system | phase3-todo.md | execution-plan.md §Phase 3, consolidated-todos.md |
| Memory system | phase4-todo.md | execution-plan.md §Phase 4, consolidated-todos.md |
| Frontend updates | phase5-todo.md | execution-plan.md §Phase 5, consolidated-todos.md |
| Testing + docs | phase6-todo.md | execution-plan.md §Phase 6, consolidated-todos.md |
| Codebase analysis | discoveries.md | review-findings-round1.md |
| Review findings | review-findings-round1.md | execution-plan.md §Review Findings |

### Key API endpoints across docs

| Endpoint | Defined in | Used in |
|----------|-----------|---------|
| `POST /api/document-groups` | phase2-todo.md Task 2.4 | execution-plan.md §Phase 2, summary-index.md |
| `GET /api/memory/episodic` | phase4-todo.md Task 4.7 | phase5-todo.md Task 5.3 |
| `POST /api/memory/extract` | phase4-todo.md Task 4.6 | phase5-todo.md Task 5.3 |
| Citation metadata in message | phase3-todo.md Task 3.3 | phase3-todo.md Task 3.5 (AssistantMessage) |

### File ownership map

| New File | Created by Phase | Referenced in |
|----------|-----------------|---------------|
| `src/models/DocumentGroup.js` | Phase 2 Task 2.1 | execution-plan.md, summary-index.md |
| `src/models/UserMemory.js` | Phase 4 Task 4.1 | execution-plan.md, summary-index.md |
| `src/services/documentParser.js` | Phase 1 Task 1.2 | phase1-todo.md |
| `src/services/documentGroupService.js` | Phase 2 Task 2.2 | execution-plan.md, summary-index.md |
| `src/services/memoryManager.js` | Phase 4 Task 4.2 | execution-plan.md, summary-index.md |
| `src/utils/citationBuilder.js` | Phase 3 Task 3.2 | phase3-todo.md, execution-plan.md |
| `src/utils/memoryExtractor.js` | Phase 4 Task 4.3 | phase4-todo.md, execution-plan.md |
| `frontend/src/stores/documentGroups.js` | Phase 5 Task 5.2 | phase5-todo.md, summary-index.md |
| `frontend/src/stores/memory.js` | Phase 5 Task 5.4 | phase5-todo.md, summary-index.md |
| `frontend/src/views/document-groups/DocumentGroupsView.vue` | Phase 5 Task 5.1 | phase5-todo.md, summary-index.md |
| `frontend/src/views/memory/MemoriesView.vue` | Phase 5 Task 5.3 | phase5-todo.md, summary-index.md |

---

## Outstanding Questions for Human Reviewer

(These were already in summary-index.md but reiterated here for visibility)

1. Is the 300-token context budget appropriate for your target models?
2. Should procedural memories be editable in frontend or remain read-only?
3. Do you want a public group browsing endpoint?
4. Is MEMORY_EXTRACTION_THRESHOLD default of 10 messages appropriate?
5. Any additional file types beyond PDF, DOCX, XLSX, CSV, TXT, MD, JSON?
