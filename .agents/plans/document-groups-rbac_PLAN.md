# Plan: Document Groups RBAC Migration

**Created**: 2026-04-29  
**Status**: Draft — pending human approval  
**Owner**: Engineering team  

---

## Purpose

Replace the document groups membership model (owner/editor/viewer per-user) with RBAC role-based visibility. Groups will use a `roles JSON` column, following the existing `tools` table pattern. A user can access any group where their user roles overlap with the group's required roles via `JSON_OVERLAPS()`.

**Target audience**: Coding agents running on local llama.cpp instances with limited context windows (~8K-32K tokens). Each task is self-contained with all necessary context, file paths, and code patterns.

**Expected outcomes:**
1. `document_groups` table uses `roles JSON DEFAULT '["user"]'` instead of `visibility ENUM` + `members JSON`
2. Group access controlled via `JSON_OVERLAPS(roles, userRoles)` — same pattern as tools table
3. Migration script converts existing groups (public→`['user']`, team→`['admin']`, private→owner's roles)
4. Role cascade deletion extended to cover document groups (on role delete, filter from group roles)
5. Frontend displays role checkboxes instead of visibility dropdown + members list
6. All member-related endpoints removed (`POST /:id/members`, `DELETE /:id/members/:uid`)

---

## Progress

- [x] Plan created and reviewed — 2026-04-29T18:30Z — completed
- [x] Phase 1: Database schema + migration — 2026-04-29 — completed
- [x] Phase 2: Backend service layer refactor — 2026-04-29 — completed
- [x] Phase 3: Backend routes + controller cleanup — 2026-04-29 — completed
- [x] Phase 4: Role cascade deletion — 2026-04-29 — completed
- [x] Phase 5: Frontend store refactor — 2026-04-29 — completed
- [x] Phase 6: Frontend view refactor — 2026-04-29 — completed
- [x] Phase 7: Documentation updates — 2026-04-29 — completed
- [ ] Validation and testing — pending (manual testing required)

---

## Big Picture Architecture

```
BEFORE (membership-based):                    AFTER (role-based):
                                             
┌─────────────────────┐                       ┌─────────────────────┐
│ document_groups     │                       │ document_groups     │
│                     │                       │                     │
│ visibility: ENUM    │                       │ roles: JSON         │
│   private/team/pub  │                       │   ["user","admin"]  │
│                     │                       │                     │
│ members: JSON       │  ───────────────►     │ (no members column) │
│ [{user_id, role}]   │    Remove            │                     │
│                     │    visibility        │ owner_id: UUID      │
│ Documents access:   │    + members         │ documents: JSON     │
│ - user is in        │                      |                     │
│   members array     │                      │ Access check:       │
└─────────────────────┘                       │ JSON_OVERLAPS(      │
                                              │   group.roles,     │
  Pattern: explicit invite                    │   user.roles)      │
  Problem: visibility enum unused,            └─────────────────────┘
         member roles not enforced             
                                              Pattern: role overlap
                                              (same as tools table)
```

**Access control flow (after migration):**

```
User requests group → Service checks JSON_OVERLAPS(group.roles, user.roles)
     │
     ├── Overlap found → grant access (read group + documents)
     │
     └── No overlap → 404 "Group not found or you do not have access"

For mutations (edit/delete/add-doc/remove-doc):
     ├── User is group owner_id → allowed
     ├── User has 'admin' role → allowed  
     └── Otherwise → 403 "Insufficient permissions"
```

---

## Decision Log

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| 2026-04-29 | Replace membership entirely with RBAC roles (Option C) | Simplest model, eliminates per-group user management. Aligns with tools table pattern. User confirmed preference. | Option A: Add roles column alongside visibility — rejected: adds complexity without removing old model. Option B: Dual model (roles + membership) — rejected: maintains two access systems. |
| 2026-04-29 | Use `JSON_OVERLAPS()` for access queries | Consistent with existing tools table pattern. Database-level filtering is efficient. No application-layer post-filtering needed. | Application-layer filtering (skills pattern) — rejected: less performant, duplicates data to filter in memory. |
| 2026-04-29 | Private groups migrate to owner's actual roles | Preserves owner access after migration. Owner can adjust roles post-migration if needed. User confirmed this approach. | Default private to `['admin']` — rejected: could lock non-admin owners out of their own groups. Custom role per group — rejected: creates excessive roles in database. |
| 2026-04-29 | Keep `owner_id` for mutation authorization | Owner concept still needed for who can edit/delete groups and manage documents. RBAC roles handle visibility, owner handles write permissions. | Remove owner entirely — rejected: need someone responsible for group mutations. Admin-only mutations — rejected: too restrictive for non-admin users. |
| 2026-04-29 | Remove `transferOwnership` member prerequisite | With no members concept, new owner doesn't need to be "a member" first. Transfer just changes `owner_id`. | Keep transferOwnership unchanged — rejected: "must be a member" check references removed members column. |
| 2026-04-29 | Add cascade deletion for groups in roleService | Consistent with existing cascade for tools and skills. Prevents orphaned roles on groups. | No cascade — rejected: deleted roles would silently grant access to stale groups. Manual cleanup — rejected: error-prone, inconsistent with existing pattern. |
| 2026-04-29 | Migration runs before dropping old columns | Preserves rollback path. Old columns remain until migration verified. | Drop first then migrate — rejected: no recovery if migration fails. |
| 2026-04-29 | getGroupAccessibleDocuments takes both userId and userRoles | Function needs userId for personal docs query AND userRoles for groups query. | Split into two functions — rejected: adds complexity at call sites (ragService). Single parameter — rejected: loses ability to query one of the two sources. |
| 2026-04-29 | Old owner loses mutation privileges after transfer, retains read access if roles match | Consistent with role-based model. Owner concept handles mutations; roles handle visibility. No special treatment needed for old owners. | Add old owner as "protected" member — rejected: reintroduces membership concept. Adjust group roles automatically — rejected: changes group policy without explicit request. |
| 2026-04-29 | New owner must have overlapping roles with group | Prevents transferring ownership to someone who cannot view the group. This replaces the old "must be a member" check. | No access check — rejected: could transfer ownership to user who can't see the group. Require admin role for new owner — rejected: too restrictive, prevents normal transfers between same-role users. |
| 2026-04-29 | Frontend uses isAdmin computed instead of isEditor | Matches backend permission model where admin users can manage documents in any group they access. | Keep isEditor — rejected: member roles concept removed. Only owner can edit — rejected: admins should be able to manage groups too. |

---

## Surprises & Discoveries

1. **Visibility enum is stored but never enforced** — The `visibility` column (`private`/`team`/`public`) has no effect on authorization. All access checks rely solely on membership (owner_id or members JSON array). A "public" group behaves identically to a "private" one in code.

2. **Member roles (editor/viewer) are not enforced** — Only owner or global admin can perform any mutation. An "editor" member has no special privileges despite the role being stored and displayed in the UI. The `isEditor` computed in the frontend shows edit buttons, but the backend rejects non-owner requests.

3. **Dead column** — `rag_documents.group_ids` is defined in schema with an index but never read or written by any code. Document-to-group mapping lives exclusively in `document_groups.documents` JSON column.

4. **Frontend `_id` vs `id` mismatch** — The Pinia store uses `g._id` for group lookups, but the backend returns `id`. This breaks local state updates after mutations (updateGroup, deleteGroup). Will be fixed as part of this change.

5. **RAG search depends on getGroupAccessibleDocuments** — `ragService.search()` calls `getGroupAccessibleDocuments(userId)` to build accessible document IDs for vector search. This function must continue working correctly after migration.

---

## Validation & Acceptance Criteria

### L1 Done (Unit/Component level)
- Service functions execute without errors when called directly
- `JSON_OVERLAPS` queries return correct groups for test role combinations
- Migration script correctly transforms visibility values to roles arrays

### L2 Done (Integration level)  
- API endpoints return expected responses with proper status codes
- Role cascade deletion removes deleted roles from existing groups
- RAG search includes documents from accessible groups

### L3 Done (System level)
- User with matching role can view group and its documents
- User without matching role gets 404 on group access
- Owner + admin can mutate groups; non-owner/non-admin gets 403
- Frontend displays groups correctly, role selection works in create/edit dialogs

### Stop Conditions
- All listed tasks are checked off in Progress section
- No unresolved items in Surprises & Discoveries
- Manual testing confirms access control works for all role combinations

---

## Plan of Work / Concrete Steps

### Phase 1: Database Schema + Migration
**Dependencies**: None (foundation for all other phases)  
**Files modified**: `src/backend/db/schema.js`  
**Files created**: `src/backend/scripts/migrateGroupRoles.js`

#### Task 1.1: Update schema.js — modify document_groups table definition
- **File**: `src/backend/db/schema.js` (lines 180-193)
- **Changes**:
  - Replace `visibility ENUM('private','team','public') DEFAULT 'private'` with `roles JSON DEFAULT '["user"]'`
  - Remove `members JSON DEFAULT '[]'`
  - Remove `INDEX idx_visibility (visibility)`
  - Add `INDEX idx_roles (roles(10))` — NOTE: prefix index on JSON column has limited effectiveness with `JSON_OVERLAPS()`. This matches the existing pattern used by the tools table (`idx_roles (roles(10))`). For small tables (likely < 100 groups), the index is not critical.
- **Acceptance**: Schema definition matches the target schema shown below

**Target schema:**
```sql
CREATE TABLE IF NOT EXISTS document_groups (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT DEFAULT '',
  owner_id      VARCHAR(36) NOT NULL,
  roles         JSON DEFAULT '["user"]',
  documents     JSON DEFAULT '[]',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_owner_id (owner_id),
  INDEX idx_roles (roles(10)),
  UNIQUE INDEX idx_name_owner (name, owner_id)
) ENGINE=InnoDB;
```

#### Task 1.2: Create migration script
- **File**: `src/backend/scripts/migrateGroupRoles.js` (NEW)
- **Purpose**: Convert existing groups from visibility+members to roles-based access
- **IMPORTANT**: This script must run BEFORE the schema drops old columns. Use `ALTER TABLE ADD COLUMN roles ...` first, then migrate, then drop old columns.
- **Logic**:
  ```javascript
  // Phase A: Add new column (safe, no data loss)
  // ALTER TABLE document_groups ADD COLUMN roles JSON DEFAULT '["user"]'

  // Phase B: Migrate data — for each existing group:
  // 1. Read current visibility, owner_id, members JSON
  // 2. Determine target roles array:
  //    - visibility == 'public'  -> start with ['user']
  //    - visibility == 'team'    -> start with ['admin']
  //    - visibility == 'private' -> fetch owner's roles from users table via JOIN
  //      KNEX query: knex('document_groups')
  //        .select('document_groups.id', 'document_groups.visibility', 'users.roles as owner_roles')
  //        .leftJoin('users', 'users.id', 'document_groups.owner_id')
  //    - If owner not found (orphaned group), default to ['user']
  // 3. Enrich roles from existing members:
  //    - Collect all member user IDs from members JSON array
  //    - Batch-fetch their roles: knex('users').whereIn('id', memberIds).select('id', 'roles')
  //    - Flatten: for each member, parse their roles JSON and add to target set
  //    - Use a Set to deduplicate
  // 4. Validate: if targetRoles is empty (shouldn't happen), default to ['user']
  // 5. Update group: SET roles = JSON.stringify(targetRoles)

  // Phase C: Drop old columns (only after verification passes)
  // ALTER TABLE document_groups DROP COLUMN visibility, DROP COLUMN members
  ```
- **Acceptance**: Script runs without errors on existing data. All groups have non-empty roles array after migration. Orphaned groups default to `['user']`. No data loss possible — old columns preserved until migration verified.

#### Task 1.3: Run migration and verify
- Execute: `node src/backend/scripts/migrateGroupRoles.js`
- Verify via SQL: `SELECT id, name, roles FROM document_groups;`
- Confirm all groups have valid JSON roles arrays with at least one role

---

### Phase 2: Backend Service Layer Refactor
**Dependencies**: Phase 1 complete  
**Files modified**: `src/backend/services/documentGroupService.js`

#### Task 2.1: Update createGroup function
- **Current signature**: `createGroup(userId, name, description, visibility)`
- **New signature**: `createGroup(userId, name, description, roles)`
- **Changes**:
  - Accept `roles` array parameter (default `['user']`)
  - Validate: if `roles` is not an array or is empty, fallback to `['user']`
  - Remove `visibility` from INSERT statement
  - Add `roles: JSON.stringify(roles || ['user'])` to INSERT
  - Remove `members` from INSERT (no longer needed)
  - Remove Knex `.transaction()` wrapper — single INSERT doesn't need transactional wrapping

#### Task 2.2: Update getUserGroups function  
- **Current query**: `WHERE owner_id = ? OR JSON_CONTAINS(members, ?)`
- **New query**: 
  ```javascript
  const groups = await knex().from('document_groups')
    .whereRaw('JSON_OVERLAPS(roles, ?)', [JSON.stringify(userRoles)])
    .orderBy('created_at', 'desc');
  ```
- **Signature change**: `getUserGroups(userId)` → `getUserGroups(userRoles)` (accept roles array)

#### Task 2.3: Update getGroupAccessibleDocuments function
- **Current query**: Uses `JSON_CONTAINS(members, ?)` to find user's groups
- **New query**: Uses `JSON_OVERLAPS(roles, ?)` with user's roles array
- **Signature change**: Accept BOTH parameters: `getGroupAccessibleDocuments(userId, userRoles)`
  - `userId` is still needed for the personal documents query: `WHERE user_id = ? AND status = 'indexed'`
  - `userRoles` is used for the groups query: `JSON_OVERLAPS(roles, ?)`
- **Update calling site**: In `ragService.js` line 216, change call to pass both `userId` and `userRoles`:
  ```javascript
  const accessibleDocsResult = await documentGroupService.getGroupAccessibleDocuments(userId, userRoles);
  ```
  Note: `ragService.search()` already receives `userId` from controller. Pass `req.user.roles` alongside it through the call chain.

#### Task 2.4: Update updateGroup function
- Replace `visibility` in allowedFields with `roles`
- When updating roles, stringify the array before persisting
- Validation: each role in the array should be validated via `roleService.isValidRole()`
  - Import `roleService` at top of file: `const roleService = require('./roleService')`
  - Validation is async — loop through roles with await before running UPDATE query
- Validate: if `roles` field is provided but is not an array or is empty, throw error "Roles must be a non-empty array"

#### Task 2.5: Remove member-related functions and simplify transferOwnership
- Delete entirely: `addMember`, `removeMember`
- **Update** `transferOwnership`:
  - Remove "new owner must already be a member" check (no members column)
  - Add access check: verify new owner can actually see the group via `JSON_OVERLAPS(group.roles, newOwnerUserRoles)` — prevents transferring to someone who can't view it
  - Verify newOwnerId exists as a valid user
  - Simplify to: just update `owner_id` in a single query (no members manipulation needed)
  - Remove Knex `.transaction()` wrapper — single UPDATE doesn't need transactional wrapping
  - **NOTE on old owner access**: After transfer, the old owner retains access only if their user roles overlap with group roles. This is expected behavior — document this in code comments. The old owner loses mutation privileges (only owner or admin can edit/delete) but retains read access if their roles match.

#### Task 2.6: Update document mutation permissions
- **addDocumentToGroup** and **removeDocumentFromGroup**:
  - Current check: `!user.roles.includes('admin') && group.owner_id !== userId`
  - This pattern is fine — keep as-is (owner or admin can mutate documents)

#### Task 2.7: Remove helper functions for members
- Delete: `findMemberIndex`, `updateMemberInGroup`, `addMemberToGroup`, `removeMemberFromGroup`
- Keep: `addDocumentToGroupDocs`, `removeDocumentFromGroupDocs` (still needed)

#### Task 2.8: Update module.exports
- Remove exports for `addMember`, `removeMember`
- Keep remaining exports unchanged

---

### Phase 3: Backend Routes + Controller Cleanup
**Dependencies**: Phase 2 complete  
**Files modified**: `src/backend/controllers/documentGroupController.js`, `src/backend/routes/documentGroups.js`

#### Task 3.1: Update controller — createGroup
- **Current**: Extracts `{ name, description, visibility }` from body
- **New**: Extracts `{ name, description, roles }` from body  
- Validate `roles` is an array with at least one element
- Pass `roles` to service instead of `visibility`

#### Task 3.2: Update controller — getGroups + getGroup
- Pass `req.user.roles` to service functions instead of `req.user.user_id`
- For `getGroup`: use role-based access check from service result (404 if not found = no access)

#### Task 3.3: Update controller — updateGroup
- Accept `roles` in request body, pass to service
- Remove `visibility` validation whitelist (`['private', 'team', 'public']`)

#### Task 3.4: Update controller — transferOwnership
- Simplify: new owner just needs to be a valid user (not "must be member")
- Pass to simplified service function

#### Task 3.5: Remove member-related controllers
- Delete entirely from file: `addMember`, `removeMember`
- Remove from module.exports

#### Task 3.6: Update routes — remove member endpoints
- **File**: `src/backend/routes/documentGroups.js`
- Remove lines:
  ```javascript
  router.post('/:id/members', authMiddleware, documentGroupController.addMember);
  router.delete('/:id/members/:uid', authMiddleware, documentGroupController.removeMember);
  ```

---

### Phase 4: Role Cascade Deletion
**Dependencies**: None (can run in parallel with Phases 2-3)  
**Files modified**: `src/backend/services/roleService.js`

#### Task 4.1: Add cascadeRemoveRoleFromGroups function
- **Pattern**: Copy `cascadeRemoveRoleFromTools` pattern, adapt for document_groups
- **Logic**:
  ```javascript
  const cascadeRemoveRoleFromGroups = async (roleName) => {
    try {
      const groups = await knex().from('document_groups');
      for (const group of groups) {
        const roles = typeof group.roles === 'string' 
          ? JSON.parse(group.roles) 
          : (group.roles || []);
        const newRoles = roles.filter(r => r !== roleName);
        if (newRoles.length === 0) {
          newRoles.push('user');
        }
        await knex().from('document_groups')
          .where({ id: group.id })
          .update({ roles: JSON.stringify(newRoles) });
      }
      logger.info(`Removed role "${roleName}" from document groups`);
    } catch (error) {
      logger.error('Cascade remove role from groups failed:', error.message);
    }
  };
  ```

#### Task 4.2: Call cascade from deleteRole
- In `deleteRole()` function, after existing cascade calls:
  ```javascript
  await cascadeRemoveRoleFromTools(normalizedName);
  await cascadeRemoveRoleFromSkills(normalizedName);
  await cascadeRemoveRoleFromGroups(normalizedName); // NEW
  ```

---

### Phase 5: Frontend Store Refactor
**Dependencies**: Phase 3 complete (API contract changed)  
**Files modified**: `src/frontend/src/stores/documentGroups.js`

#### Task 5.1: Fix _id → id mismatch (existing bug)
- Replace ALL occurrences of `._id` with `.id` in store actions — applies to both group IDs and document IDs
- Affected lines: 65 (`findIndex(g => g._id === id)`), 69 (`currentGroup?._id`), 86 (`filter(g => g._id !== id)`), 87 (`currentGroup?._id`)
- Also fix in transferOwnership, addDocument, removeDocument (lines 137, 154, 171)
- Note: `addMember` and `removeMember` actions are being removed entirely (see Task 5.3)

#### Task 5.2: Update createGroup action
- Change signature from `createGroup(name, description, visibility)` to `createGroup(name, description, roles)`
- Pass `{ name, description, roles }` in POST body

#### Task 5.3: Remove member-related actions
- Delete: `addMember(groupId, userId, role)`, `removeMember(groupId, userId)`

---

### Phase 6: Frontend View Refactor
**Dependencies**: Phase 5 complete  
**Files modified**: `src/frontend/src/views/document-groups/DocumentGroupsView.vue`

#### Task 6.1: Replace visibility select with role checkboxes
- **Create dialog**: Replace `<Select v-model="createForm.visibility">` with role checkboxes (same pattern as `EditToolView.vue`)
  ```vue
  <label>Roles</label>
  <div class="role-checkboxes">
    <label v-for="role in availableRoles" :key="role" class="role-checkbox">
      <Checkbox v-model="selectedCreateRoles" inputId="create-role-{{ role }}" :value="role" />
      <span>{{ role }}</span>
    </label>
  </div>
  ```
- **Edit dialog**: Same replacement for edit form

#### Task 6.2: Add role store import and initialization
- Import `useRoleStore` from `@/stores/role`
- In `onMounted`, call `roleStore.listRoles()` (alongside existing fetches)
- Add `availableRoles` computed: `computed(() => roleStore.roles.map(r => r.name))`
- Add `selectedCreateRoles` ref (default `['user']`) and `selectedEditRoles` ref

#### Task 6.3: Remove members tab and member management UI
- Remove the "Members" `<Tab>` from Tabs component
- Remove members list rendering (`v-for="member in selectedGroup.members"`)
- Remove add-member form (InputText + Select + Button)
- Simplify to single-tab view showing only documents

#### Task 6.4: Update group card display
- Replace visibility badge with roles badges:
  ```vue
  <Badge v-for="role in parseRoles(group.roles)" :key="role" :value="role" />
  ```
- Add `parseRoles` helper function (handles JSON string → array)

#### Task 6.5: Fix _id → id references throughout the view
- Template line 18: `:key="group._id"` → `:key="group.id"`
- `selectGroup` function: `group._id` → `group.id`
- `updateGroup`, `deleteGroup`: `selectedGroup.value._id` → `selectedGroup.value.id`
- Document actions: `selectedDocToAdd.value._id` → `selectedDocToAdd.value.id` (line 256)
- Template line 65: `:key="docRef.document_id._id || docRef.document_id"` — this references the document's ID in a ref object. The backend returns `id` not `_id`. Change to `docRef.document_id?.id || docRef.document_id`

#### Task 6.6: Update action handlers and computed properties
- `createGroup()`: pass `selectedCreateRoles.value` instead of `createForm.value.visibility`
- `updateGroup()`: include `roles: selectedEditRoles.value` in update payload
- Remove `addMember()` and `removeMember()` handlers
- **Remove** `isEditor` computed property entirely (lines 166-170 references removed `members` column)
- **Add** `isAdmin` computed property: `computed(() => authStore.user?.roles?.includes('admin') || false)`
- Replace `isOwner || isEditor` guards (template lines 68, 72) with `isOwner || isAdmin` — matches backend permission model where owner or global admin can manage documents
- **Remove** dead functions: `getVisibilitySeverity` (line 180), `getMemberCount` (line 190), `getRoleSeverity` (line 185)
- **Update** `activeTab` default from `'members'` to `'documents'` (line 150) — members tab is removed

#### Task 6.7: Update CSS
- Remove `.member-item`, `.member-actions` styles (or keep for reuse)
- Add `.role-checkboxes` style (match EditToolView pattern):
  ```css
  .role-checkboxes {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .role-checkbox {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  ```

---

### Phase 7: Documentation Updates
**Dependencies**: All previous phases complete  
**Files modified/deleted**: Multiple docs files

#### Task 7.1: Update docs/features/document-groups.md
- Rewrite to describe role-based model (not membership)
- Update schema diagram (remove members, add roles)
- Remove visibility levels table — replace with role-based access description
- Remove API endpoints for addMember/removeMember
- Update all flow diagrams

#### Task 7.2: Delete member function docs
- **DELETE**: `docs/functions/document-group/addMember.md`
- **DELETE**: `docs/functions/document-group/removeMember.md`

#### Task 7.3: Update docs/functions/document-group-functions.md
- Remove addMember and removeMember from functions list
- Update description (remove "membership" references, describe role-based model)

#### Task 7.4: Rewrite docs/functions/document-group/schema-and-permissions.md
- Replace schema diagram with new structure (roles JSON column, no members)
- Replace permission matrix: owner/admin can mutate; access controlled by roles overlap
- Remove member-related permissions (add member, remove member)

#### Task 7.5: Update docs/functions/document-group/createGroup.md
- Change signature to `createGroup(userId, name, description, roles)`
- Remove `visibility` and `members` from process diagram
- Add `roles: JSON.stringify(roles || ['user'])` to INSERT statement
- Note: uses Knex transaction (not MongoDB session)

#### Task 7.6: Update docs/functions/document-group/updateGroup.md
- Change allowed fields from `[name, description, visibility]` to `[name, description, roles]`
- Remove "editor" permission reference — only owner or admin can update

#### Task 7.7: Update docs/functions/document-group/transferOwnership.md
- Remove "new owner must be existing member" prerequisite
- Simplify transaction flow: just update `owner_id`, no members manipulation
- Note: uses Knex transaction (not MongoDB session)

#### Task 7.8: Update docs/functions/document-group/getGroupAccessibleDocuments.md
- Change query pattern from `JSON_CONTAINS(members, ...)` to `JSON_OVERLAPS(roles, ...)`
- Update merge flow diagram to reflect new access check

#### Task 7.9: Update docs/architecture/database-schema.md
- Update document_groups table definition
- Remove visibility/members columns, add roles column with index

#### Task 7.10: Update docs/CHANGELOG.md
- Add entry with timestamp describing the migration from membership to RBAC roles
- Include note about removed endpoints and API contract changes

#### Task 7.11: Update other affected documentation
- **Update** `docs/qa/practical-examples.md`: Update curl examples for document groups (replace visibility with roles, remove member endpoint examples)
- **Update** `.agents/plans/execution-plan.md`: Update references to document group membership model — replace with role-based descriptions where referenced
- **Note**: Files in `.agents/plans/tmp/` (`phase2-todo.md`, `phase5-todo.md`, `consolidated-todos.md`) reference the old model but are gitignored temp files. No action needed unless agents reference them as context.

---

## Files Summary

| File | Phase | Action |
|------|-------|--------|
| `src/backend/db/schema.js` | 1 | Modify — replace visibility/members with roles column |
| `src/backend/scripts/migrateGroupRoles.js` | 1 | **NEW** — migration script for existing data |
| `src/backend/services/documentGroupService.js` | 2 | Refactor — role-based access, remove member functions |
| `src/backend/controllers/documentGroupController.js` | 3 | Update — roles param, remove member actions |
| `src/backend/routes/documentGroups.js` | 3 | Remove — member endpoints |
| `src/backend/services/roleService.js` | 4 | Add — cascadeRemoveRoleFromGroups |
| `src/frontend/src/stores/documentGroups.js` | 5 | Refactor — roles param, fix _id bug, remove member actions |
| `src/frontend/src/views/document-groups/DocumentGroupsView.vue` | 6 | Refactor — role checkboxes, remove members tab |
| `docs/features/document-groups.md` | 7.1 | Rewrite — role-based model description |
| `docs/functions/document-group/addMember.md` | 7.2 | **DELETE** — function removed |
| `docs/functions/document-group/removeMember.md` | 7.2 | **DELETE** — function removed |
| `docs/functions/document-group-functions.md` | 7.3 | Update — remove member functions from list |
| `docs/functions/document-group/schema-and-permissions.md` | 7.4 | Rewrite — new schema + permissions matrix |
| `docs/functions/document-group/createGroup.md` | 7.5 | Update — roles param, remove members/visibility |
| `docs/functions/document-group/updateGroup.md` | 7.6 | Update — allowed fields (roles instead of visibility) |
| `docs/functions/document-group/transferOwnership.md` | 7.7 | Update — remove member prerequisite |
| `docs/functions/document-group/getGroupAccessibleDocuments.md` | 7.8 | Update — JSON_OVERLAPS query pattern |
| `docs/architecture/database-schema.md` | 7.9 | Update — table definition |
| `docs/CHANGELOG.md` | 7.10 | Add — changelog entry |
| `docs/qa/practical-examples.md` | 7.11 | Update — curl examples for document groups |
| `.agents/plans/execution-plan.md` | 7.11 | Update — references to membership model |

---

## Execution Order

```
Phase 1 (schema + migration) ──────────────┐
                                            ├──► Phase 2 (services) ──► Phase 3 (routes/controllers)
Phase 4 (cascade deletion) ────────────────┘                             │
                                                                        ▼
Phase 5 (frontend store) ◄──────────────────────────────────────────── Phase 6 (frontend view)
                                                                        │
                                                                        ▼
Phase 7 (documentation) ◄──────────────────────────────────────────── Validation
```

**Parallel opportunities**: Phase 4 can run in parallel with Phases 2-3. No data migration needed for Phase 4 since it reads existing roles column.

---

## Related Documentation

- [Execution Plan](./execution-plan.md) — parent plan covering RAG + memory features
- [Role Management Feature](../../docs/features/role-management.md) — RBAC roles documentation
- [Tool Support Feature](../../docs/features/tool-support.md) — reference for JSON_OVERLAPS pattern
- [Middleware Documentation](../../docs/components/middleware.md) — RBAC middleware reference
