# Phase 5: Frontend Updates - Detailed Todo List

**Phase**: 5 of 6  
**Dependencies**: Phases 1-4 (all backend features implemented)  
**Estimated effort**: ~2-3 days  

---

## Purpose

Build UI components for document groups management, citation display in chat, and memory browsing/management.

---

## Task 5.1: Create DocumentGroupsView.vue

**File**: `frontend/src/views/document-groups/DocumentGroupsView.vue`

- [ ] Main group list view:
  - Table/card grid showing all user's groups
  - Columns: name, description, visibility badge, member count, document count, actions
  - "Create Group" button in header
  
- [ ] Create group dialog:
  - PrimeVue Dialog component
  - Fields: name (required), description (optional), visibility dropdown (private/team/public)
  - Create action calls `documentGroupsStore.createGroup()`

- [ ] Group detail view (clicking a group):
  - Shows full group info with edit button
  - Two tabs: Members | Documents
  
- [ ] Members tab:
  - List of members with role badges (owner/editor/viewer)
  - "Add Member" button (admin/owner only) — opens dialog with user search + role selection
  - Remove member button (next to each member, except self as owner)
  
- [ ] Documents tab:
  - List of documents in the group (filename, type, status)
  - "Add Document" button — opens document selector showing user's indexed RAG documents
  - Remove document button

- [ ] Delete group confirmation dialog

**Acceptance criteria:**
- View loads all groups for the current user on mount
- Create group dialog submits correctly and refreshes list
- Group detail view shows correct members and documents
- Add/remove operations update UI immediately

---

## Task 5.2: Create DocumentGroups Store

**File**: `frontend/src/stores/documentGroups.js`

- [ ] Define Pinia store state:
  ```javascript
  state: () => ({
    groups: [],
    currentGroup: null,
    accessibleDocs: [],
    loading: false,
    error: null
  })
  ```

- [ ] Implement actions:
  - `createGroup(name, description)` — POST /api/document-groups
  - `fetchGroups()` — GET /api/document-groups
  - `fetchGroup(id)` — GET /api/document-groups/:id
  - `updateGroup(id, data)` — PATCH /api/document-groups/:id
  - `deleteGroup(id)` — DELETE /api/document-groups/:id
  - `addMember(groupId, userId, role)` — POST /api/document-groups/:id/members
  - `removeMember(groupId, userId)` — DELETE /api/document-groups/:id/members/:uid
  - `transferOwnership(groupId, newOwnerId)` — POST /api/document-groups/:id/transfer
  - `addDocument(groupId, documentId)` — POST /api/document-groups/:id/documents
  - `removeDocument(groupId, documentId)` — DELETE /api/document-groups/:id/documents/:did
  - `fetchAccessibleDocs()` — GET /api/document-groups/accessible

- [ ] Follow existing store pattern (see `frontend/src/stores/rag.js` for reference)
- [ ] All actions access `response.data.data` (not `response.data` directly per AGENTS.md)

**Acceptance criteria:**
- All API calls return properly structured data
- Loading/error state managed correctly
- Groups list updates after create/delete operations

---

## Task 5.3: Create MemoriesView.vue

**File**: `frontend/src/views/memory/MemoriesView.vue`

- [ ] Tabbed interface with three tabs: Episodic | Semantic | Procedural

- [ ] Each tab shows:
  - Search bar (semantic tab only)
  - List of memories with: content, created date, confidence score, source session link
  - Delete button for each memory
  
- [ ] Episodic tab specifics:
  - Shows expiration countdown or "expired" badge
  - Clicking a source session link navigates to that chat session
  
- [ ] Semantic tab specifics:
  - Search input queries `/api/memory/semantic?q=...`
  - Results sorted by relevance/confidence
  - Keywords shown as tags below each memory
  
- [ ] Procedural tab specifics:
  - Shows all user preferences and patterns
  - Editable? (for manual correction of extracted memories)

- [ ] "Extract memories" button:
  - Dropdown to select a chat session
  - Calls POST /api/memory/extract with session_id
  - Shows loading state during extraction

**Acceptance criteria:**
- All three tabs display correct memory types
- Semantic search returns filtered results
- Delete operations work with confirmation
- Manual extraction triggers backend process and shows results

---

## Task 5.4: Create Memories Store

**File**: `frontend/src/stores/memory.js`

- [ ] Define Pinia store state:
  ```javascript
  state: () => ({
    memories: [],
    episodic: [],
    semantic: [],
    procedural: [],
    loading: false,
    error: null
  })
  ```

- [ ] Implement actions:
  - `fetchMemories(layer, limit)` — GET /api/memory/memories?layer=X&limit=Y
  - `fetchEpisodic()` — GET /api/memory/episodic
  - `fetchSemantic(query?)` — GET /api/memory/semantic?q=query
  - `fetchProcedural()` — GET /api/memory/procedural
  - `extractMemories(sessionId)` — POST /api/memory/extract
  - `deleteMemory(id)` — DELETE /api/memory/:id

- [ ] Follow existing store pattern

**Acceptance criteria:**
- Store correctly fetches and stores memories by layer
- Search works for semantic memories
- Extraction action triggers backend process

---

## Task 5.5: Update AssistantMessage Component to Show Citations

**File**: `frontend/src/components/chat/AssistantMessage.vue` (message-level component)

Rationale: Citations are stored per-message in `message.metadata.citations`. This belongs in the message rendering component, not the overall chat view. Phase 3 Task 3.5 creates this same section — Phase 5 Task 5.5 is redundant if Phase 3 is already done. If AssistantMessage was not modified in Phase 3, implement here.

- [ ] After rendering assistant message content, conditionally show sources:
  ```vue
  <div v-if="message.metadata?.citations?.length > 0" class="chat-citations">
    <Button 
      label="Show Sources" 
      severity="secondary" 
      text 
      size="small"
      @click="toggleCitations(message)" 
    />
    <Transition name="slide">
      <div v-if="message.showCitations" class="citations-panel">
        <h4>Sources</h4>
        <div v-for="citation in message.metadata.citations" :key="citation.source_id"
              class="citation-item" @click="goToDocument(citation.source_id)">
          <span class="citation-score">{{ (citation.similarity * 100).toFixed(0) }}%</span>
          <span class="citation-filename">{{ citation.filename }}</span>
          <span class="citation-chunk">Chunk {{ citation.chunk_index }}</span>
        </div>
      </div>
    </Transition>
  </div>
  ```

- [ ] Add methods:
  - `toggleCitations(message)` — shows/hides citations panel for a message
  - `goToDocument(documentId)` — navigates to RAGDocumentsView with document filter

- [ ] Style citations panel with PrimeVue Aura theme colors
- [ ] Use Transition component for smooth expand/collapse

**Acceptance criteria:**
- Citations panel appears below messages with citation metadata
- Panel expands/collapses smoothly
- Source click navigation works
- No citations shown when message has no metadata.citations

---

## Task 5.6: Add Router Entries

**File**: `frontend/src/router/index.js`

- [ ] Add route for Document Groups:
  ```javascript
  { path: 'document-groups', name: 'document-groups', component: () => import('../views/document-groups/DocumentGroupsView.vue') }
  ```

- [ ] Add route for Memory:
  ```javascript
  { path: 'memory', name: 'memory', component: () => import('../views/memory/MemoriesView.vue') }
  ```

- [ ] Ensure routes are protected by auth guard (unauthenticated → /login)
- [ ] Verify routes appear in sidebar navigation after Task 5.7

**Acceptance criteria:**
- Both new routes are registered and accessible
- Auth guard redirects unauthenticated users to /login for both routes
- Routes use dynamic imports (code splitting)

---

## Task 5.7: Update Sidebar Navigation

**File**: `frontend/src/components/layout/Sidebar.vue` (or equivalent)

- [ ] Add "Document Groups" menu item:
  - Under "Documents" section or as standalone
  - Icon: pi pi-users or pi pi-folder-open
  - Route: `/document-groups`
  
- [ ] Add "Memory" menu item:
  - As standalone top-level item or under Settings
  - Icon: pi pi-brain or pi pi-database
  - Route: `/memory`

**Acceptance criteria:**
- New menu items appear in sidebar
- Navigation routes to correct views
- Items respect auth guard (visible to all authenticated users)

---

## Task 5.8: Update Chat Session Creation

**File**: `frontend/src/views/chat/ChatSessionForm.vue` (or wherever sessions are created)

- [ ] When RAG is enabled on new session:
  - Show document selector that includes both personal docs AND group-accessible docs
  - Use `documentGroupsStore.fetchAccessibleDocs()` to populate group doc list
  
- [ ] Document selector:
  - Searchable dropdown showing document name, type, source (personal/group: groupName)
  - Multi-select checkbox style
  - Shows count of total available documents

**Acceptance criteria:**
- New session form shows RAG document selector when RAG enabled
- Selector includes both personal and group-accessible documents
- Selected documents passed to session creation API

---

## Notes for Implementers

- Follow existing PrimeVue component patterns (see `RAGDocumentsView.vue` for style reference)
- Use Tailwind CSS classes following the existing convention (gray-900 text, white backgrounds, rounded-8px cards)
- All API calls use Pinia stores — never direct axios calls from views
- Follow 401/403 auto-redirect pattern via axios interceptor
