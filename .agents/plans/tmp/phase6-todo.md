# Phase 6: Integration Testing + Documentation - Detailed Todo List

**Phase**: 6 of 6  
**Dependencies**: Phases 1-5 (all features implemented)  
**Estimated effort**: ~2 days  

---

## Purpose

End-to-end verification of all new features and comprehensive documentation updates.

---

## Task 6.1: End-to-End Test Scenarios

### Test Suite: Document Parsing
- [ ] Upload a PDF with text content → verify status transitions: uploaded → processing → indexed
- [ ] Upload an XLSX with multiple sheets → verify all sheet contents extracted as markdown tables
- [ ] Upload a DOCX with headings and lists → verify structure preserved in text
- [ ] Upload an encrypted PDF → verify status = 'failed' with parse_error message
- [ ] Upload a CSV with quoted fields → verify proper escaping

### Test Suite: Document Groups
- [ ] Create group as user A → verify owner role assigned automatically
- [ ] Add user B as editor → verify user B can see documents but not delete group
- [ ] Add user C as viewer → verify user C can search group documents via RAG
- [ ] Set visibility to 'public' → verify user D (not a member) can see group in accessible list
- [ ] Remove user B → verify user B loses access to group documents immediately
- [ ] Transfer ownership from A to B → verify A becomes viewer, B becomes owner
- [ ] Delete group → verify documents are NOT deleted (ownership unchanged)

### Test Suite: Citations
- [ ] Chat with RAG enabled on session with 2 indexed documents
- [ ] Verify assistant response includes inline [1], [2] markers
- [ ] Verify citation metadata stored in message.metadata.citations
- [ ] Click source in frontend → verify navigation to document chunks view
- [ ] Chat without RAG → verify no citations in response

### Test Suite: Persistent Memory
- [ ] Run 15-message conversation → verify memory extraction triggers
- [ ] Check UserMemory DB entries created for all 3 layers
- [ ] Start new session with different topic → verify episodic memories from prior session are NOT included (different context)
- [ ] Start new session mentioning a fact from prior session → verify semantic memory retrieval includes that fact
- [ ] Verify procedural memories (preferences) appear in system message on new session
- [ ] Manually extract memories from old session via POST /api/memory/extract

### Test Suite: Cross-Feature Integration
- [ ] User A uploads doc → adds to group → User B chats with RAG → sees citation to User A's doc
- [ ] User A has semantic memory about API design → User B searches for same topic → gets User A's doc as result (if shared via group)
- [ ] Large document (50+ pages PDF) → verify processing completes within 30 seconds

---

## Task 6.2: Performance Testing

- [ ] **Document processing**: Upload 10-page PDF, measure time from upload to 'indexed' status. Target: <30s
- [ ] **Search performance**: Index 1000 documents, run search query. Measure response time. Target: <2s
- [ ] **Memory extraction**: 50-message conversation, measure extraction time. Target: <10s
- [ ] **Context budget**: Verify total system message (skills + memory + RAG) stays under context window limit

---

## Task 6.3: Documentation Updates

### Update existing docs
- [ ] Update `docs/features/rag-system.md`:
  - Add new file types (xlsx) with parsing details
  - Add document groups section
  - Add citation system section
  - Update API endpoint table with new endpoints
  - Update schema diagram with new fields

### Create new docs
- [ ] Create `docs/features/document-groups.md`:
  - Purpose and overview
  - DocumentGroup model schema diagram
  - Group workflow diagrams (create, add members, share docs)
  - RBAC matrix (owner/editor/viewer permissions)
  - API endpoints reference
  - Practical examples
  
- [ ] Create `docs/features/persistent-memory.md`:
  - Purpose and overview
  - Three-layer memory explanation (episodic/semantic/procedural)
  - UserMemory model schema diagram
  - Memory extraction workflow
  - Memory lifecycle (creation, access, expiration, consolidation)
  - API endpoints reference
  - Practical examples
  
- [ ] Create `docs/features/citation-system.md`:
  - Purpose and overview
  - Citation format specification ([n] markers + source list)
  - System message template for citation prompting
  - Frontend rendering specification
  - API integration points

### Update architecture docs
- [ ] Update `docs/architecture/database-schema.md`:
  - Add DocumentGroup model
  - Add UserMemory model
  - Update RAGDocument schema (group_ids, sheets, parse_error)
  
- [ ] Update `docs/architecture/system-architecture.md`:
  - Add document groups flow to architecture diagram
  - Add memory system to component diagram
  - Update data flow diagrams

### Create QA pages
- [ ] Create `docs/qa/document-groups-qa.md`:
  - Test cases with expected results
  - Common issues and troubleshooting
  
- [ ] Create `docs/qa/persistent-memory-qa.md`:
  - Memory extraction scenarios
  - Context budget management examples

---

## Notes for Implementers

- All documentation should follow the existing format (see `docs/features/rag-system.md` as template)
- Include ASCII diagrams for schemas and workflows
- QA pages should be actionable — someone reading them should be able to verify features work
- Update tags-index.md with new feature tags: `document-groups`, `persistent-memory`, `citations`
