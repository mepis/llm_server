# Phase 1.0: Bug Fix — ragService.searchDocuments() Call Signature

**Phase**: 1.0 of 6 (pre-phase)  
**Dependencies**: None  
**Estimated effort**: ~30 minutes  

---

## Purpose

Fix the broken RAG search call in chatService before building new features on top of it. The current code passes `session.rag_document_ids` (an array of ObjectIds) as the first argument to `ragService.searchDocuments()`, but the service expects a `userId` string. This means RAG search in chat sessions has been silently failing.

**Root cause**: `ragService.searchDocuments(userId, query)` takes a userId string, but three locations in chatService pass `session.rag_document_ids` (array of ObjectIds) as the first argument.

---

## Tasks

### Task 1.0.1: Fix ragService.searchDocuments() signature

**File**: `src/services/ragService.js`

- [ ] Change function signature from `(userId, query)` to `(userId, query, limit = 10, documentIds = [])`
- [ ] When `documentIds` is provided (non-empty): filter search to only those specific document IDs
- [ ] When `documentIds` is empty/not provided: search all documents where `user_id === userId` and `status === 'indexed'`

**Acceptance criteria:**
- Function accepts optional 3rd and 4th parameters without breaking existing calls
- New signature supports both single-user search and targeted document set search

---

### Task 1.0.2: Fix chatService.runLoop() call (line ~362)

**File**: `src/services/chatService.js`

Was:
```javascript
const ragResult = await ragService.searchDocuments(
  session.rag_document_ids, content
);
```

Fix to:
```javascript
const ragResult = await ragService.searchDocuments(
  userId, content, 5, session.rag_document_ids
);
```

**Acceptance criteria:**
- `userId` is a string (from auth middleware), not an array
- RAG search returns actual results instead of silently failing

---

### Task 1.0.3: Fix chatService.streamRunLoop() call (line ~527)

**File**: `src/services/chatService.js`

Same fix as Task 1.0.2 — identical pattern in streaming handler.

**Acceptance criteria:**
- Streaming RAG search returns results for chat sessions with rag_enabled

---

### Task 1.0.4: Fix chatService.chatWithLLM() call (line ~261)

**File**: `src/services/chatService.js`

Same fix as Task 1.0.2 — identical pattern in the third RAG call site.

**Acceptance criteria:**
- All three RAG call sites use consistent signature `(userId, query, limit, documentIds)`

---

### Task 1.0.5: Verify ragController.searchDocuments passes userId correctly

**File**: `src/controllers/ragController.js`

Was passing `userId` as first arg which was correct. New signature is `(userId, query, top_k)` — no change needed but verify the call site still works with the new signature (limit defaults to 10, documentIds defaults to []).

**Acceptance criteria:**
- Existing `/api/rag/search` endpoint continues to work without modification
- No test failures after changes

---

## Notes for Implementers

- The fix is purely at the call site level — `ragService.js` can keep backward compatibility by making `limit` and `documentIds` optional parameters with defaults
- After fixing, RAG search in chat sessions should return actual results (was silently failing before)
- This is a minimal change — no new features, just fixing broken existing functionality
