# Plan Review Findings — Round 1

Date: 2026-04-23  
Reviewers: Backend Architecture Agent, Frontend Architecture Agent, Documentation & QA Agent  

---

## Critical Issues Found (13 total)

### Backend (4 critical)

1. **DocumentGroup name unique constraint** — `unique: true` on name prevents two users from creating groups with the same name. Fix: Remove unique, add compound index `{ owner_id: 1, name: 1 }`.

2. **Citation injection unreliable via LLM prompting** — llama.cpp models frequently ignore system prompt instructions about citation formatting. Fix: Add deterministic fallback that re-runs search on response sentences to find matching chunks and inject `[n]` markers.

3. **MemoryExtractor has no fallback if llama.cpp unavailable** — If llama.cpp is down, no memories get extracted with no degradation path. Fix: Add keyword-based heuristic fallback (episodic from sentence boundaries, semantic from declarative patterns, procedural from preference keywords).

4. **MemoryExtractor receives system/RAG messages as conversation content** — Will extract spurious memories from system prompts and RAG context chunks. Fix: Filter `session.messages` to only user/assistant text messages before extraction.

### Frontend (4 critical)

5. **Missing router entries for new views** — `/document-groups` and `/memory` routes not defined in `router/index.js`. Fix: Add route entries with dynamic imports.

6. **Citations should be in AssistantMessage component, not ChatView** — Citations are message-level data (stored in `message.metadata.citations`). ChatView doesn't have direct access to individual message metadata. Fix: Target `AssistantMessage.vue` or add `<Citations>` slot on `MessageBubble.vue`.

7. **Streaming citations metadata not handled in SSE protocol** — `sendStreamingMessage()` in chat.js only extracts `content` and `subject` from done events, not citation metadata. Fix: Update done handler to extract `data.metadata?.citations`.

8. **Session creation form location unclear** — No ChatSessionForm.vue exists; RAG document selection needs a home. Fix: Either create new dialog component or convert sidebar "New Chat" click handler to open dialog with RAG options.

### Documentation & Testing (5 critical)

9. **UserMemory model missing embedding field** — Semantic memory search requires vector similarity, but model only has text content and tags. Fix: Add `embedding: [Number]` field to UserMemory schema.

10. **No error case tests defined** — All test scenarios are happy paths. Missing: failed parsing, unauthorized access, expired memories, malformed files, llama.cpp timeout, context overflow. Fix: Add "Error Case Test Suite" section.

11. **Bug fix for ragService.searchDocuments call signature not tracked as task** — The bug is mentioned in surprises but Phase 6 testing will catch it late. Fix: Add Phase 1.0 "Bug Fix" task before other phases begin.

12. **MemoryExtractor prompt structure not specified** — No concrete extraction prompt template defined, making it untestable. Fix: Define structured extraction prompt with JSON output schema in persistent-memory.md.

13. **Transfer ownership test exists but backend method not specified** — Test suite mentions transfer ownership but Phase 2 Task 2.2 does NOT include transferOwnership() method. Fix: Add transferOwnership to DocumentGroup service.

---

## High Issues Found (18 total)

### Backend Highlights
- Missing JSON parser in DocumentParser (Plan only covers PDF/DOCX/XLSX/CSV/TXT/MD, but .json files also supported)
- Sheet-to-chunk mapping for XLSX citations — need to track sheet_name per chunk
- MongoDB $in query could blow up with thousands of docs — use two-phase search
- UserMemory schema uses `created_at` in metadata which conflicts with Mongoose timestamps plugin
- Token budget unrealistic (500 tokens total, 20 procedural entries max) — cap at 300 tokens, fewer entries per layer
- Memory/document group routes not explicitly registered in api.js (mentioned but not as explicit tasks)

### Frontend Highlights
- No pagination strategy for DocumentGroupsView and MemoriesView
- No loading/error state pattern specified for MemoriesView  
- Document selector API endpoint not defined (needs combined personal + group docs)
- Procedural memory editability ambiguous — needs decision (yes/no)
- User search component for Add Member dialog not verified/exist

### Documentation & Testing Highlights
- RBAC matrix described but Role model has no permissions field — must document custom permission model
- No existing QA page format reference — need to define structure
- Context budget has no defined limit or measurement method
- tags-index.md update only in notes, not as explicit task
- No architecture diagram planned for new models
- Missing updates to chat-sessions.md, llm-integration.md, api-endpoints.md

---

## Changes Made to Execution Plan

The following sections of `execution-plan.md` have been updated:
- Decision Log: Added entries for compound index, deterministic citations, llama.cpp fallback, context budget
- Surprises & Discoveries: Incorporated all 3 review agent findings
- Phase 1: Added Phase 1.0 bug fix task, added JSON parser, MIME/extension dual acceptance
- Phase 2: Fixed name unique constraint, added transferOwnership with Mongoose sessions, fixed $in query pattern
- Phase 3: Added deterministic citation injection fallback, extracted shared RAG helper function
- Phase 4: Fixed schema timestamp issue, reduced token budget to 300, added keyword fallback extractor, added PII redaction, added embedding field to UserMemory
- Phase 5: Added router entries, changed citation target component, added streaming metadata handling, defined session creation approach
- Phase 6: Added error case test suite, explicit context budget test, ownership transfer test, TTL expiration test

## Changes Made to Phase Todo Files

All phase todo files in `.agents/plans/tmp/` have been updated with the corresponding fixes.
