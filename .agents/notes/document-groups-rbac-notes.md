# Notes: Document Groups RBAC Migration

**Created**: 2026-04-29  
**Related plan**: `.agents/plans/document-groups-rbac_PLAN.md`

---

## Research Findings

### Existing RBAC Patterns in Codebase

**Tools table (reference pattern)** — `src/backend/services/toolService.js`:
- `roles JSON DEFAULT '["user"]'` column
- Access check: `JSON_OVERLAPS(roles, ?)` with `JSON.stringify(userRoles)`
- Cascade deletion on role delete filters from tools.roles
- Frontend: checkbox list for role selection (EditToolView.vue)

**Skills filesystem** — `src/backend/services/skillService.js`:
- Roles stored in YAML frontmatter of SKILL.md files
- Application-layer filtering: `skillRoles.some(r => userRoles.includes(r))`
- Cascade deletion rewrites SKILL.md files on role delete

**Document groups (current state)**:
- `visibility ENUM('private','team','public')` — stored but NEVER checked in code
- `members JSON [{user_id, role}]` — used for access control via `JSON_CONTAINS`
- Member roles (`owner`, `editor`, `viewer`) — stored but NOT enforced for permissions
- Only owner or global admin can perform mutations (member role is cosmetic)

### Key Code Locations

| Component | File | Lines |
|-----------|------|-------|
| Schema definition | `src/backend/db/schema.js` | 180-193 |
| Service layer | `src/backend/services/documentGroupService.js` | Full file (436 lines) |
| Controller | `src/backend/controllers/documentGroupController.js` | Full file (136 lines) |
| Routes | `src/backend/routes/documentGroups.js` | 1-18 |
| Frontend store | `src/frontend/src/stores/documentGroups.js` | Full file (198 lines) |
| Frontend view | `src/frontend/src/views/document-groups/DocumentGroupsView.vue` | Full file (386 lines) |
| Role cascade | `src/backend/services/roleService.js` | 84-172 (deleteRole + cascades) |
| RAG integration | `src/backend/services/ragService.js` | 203-225 (search uses getGroupAccessibleDocuments) |

### Bug: _id vs id Mismatch

Frontend store (`documentGroups.js`) consistently uses `_id` for group identity comparisons, but the backend schema defines `id VARCHAR(36)` as primary key. This means:
- `findIndex(g => g._id === id)` — always returns -1 (never matches)
- `filter(g => g._id !== id)` — never filters anything out
- Local state after mutations becomes stale

**Fix**: Replace all `_id` with `id` in the store. Same issue exists in the view component.

### RAG Search Dependency

`ragService.search()` at line 216 calls `getGroupAccessibleDocuments(userId)` to build accessible document IDs for vector search. This function queries groups using `JSON_CONTAINS(members, ...)`. After migration, this must use `JSON_OVERLAPS(roles, ...)` instead. If broken, RAG searches won't include group-shared documents.

---

## Migration Data Mapping

| Old visibility | New roles | Rationale |
|----------------|-----------|-----------|
| `public` | `['user']` | Any authenticated user can see the group |
| `team` | `['admin']` | Only admins (team leads) can access |
| `private` | owner's roles array | Preserves owner access; if owner only has `['user']`, group becomes accessible to all users (acceptable trade-off, user confirmed) |

**Additional consideration for migration**: Existing members should influence role selection. If a private group had members with custom roles, those roles should be included in the target roles array to maintain access continuity.

---

## API Contract Changes

### Removed endpoints:
- `POST /api/document-groups/:id/members` — add member
- `DELETE /api/document-groups/:id/members/:uid` — remove member

### Changed request bodies:

**Create group (POST /)**:
```json
// Before
{ "name": "...", "description": "...", "visibility": "private" }

// After  
{ "name": "...", "description": "...", "roles": ["user"] }
```

**Update group (PATCH /:id)**:
```json
// Before
{ "name": "...", "description": "...", "visibility": "team" }

// After
{ "name": "...", "description": "...", "roles": ["admin"] }
```

### Transfer ownership simplification:
- **Before**: New owner must be a member of the group (checked via members JSON)
- **After**: New owner just needs to be a valid user in the system

---

## Frontend Component Changes

### DocumentGroupsView.vue — structural changes:
1. Remove "Members" tab entirely (was Tab value="members")
2. Replace visibility `<Select>` with role checkboxes (3 places: create dialog, edit dialog)
3. Group card badges: visibility badge → roles badges
4. Remove `isEditor` computed property (no member roles anymore)
5. Add `useRoleStore` import and initialize on mount

### documentGroups store — structural changes:
1. Remove `addMember`, `removeMember` actions
2. Change `createGroup` signature to accept `roles` array
3. Fix `_id` → `id` throughout (8 occurrences)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration script runs on large dataset | Slow execution, DB lock | Script processes groups in batches; test on small dataset first |
| RAG search breaks during migration | Group docs excluded from search results | Test getGroupAccessibleDocuments immediately after migration |
| Frontend _id bug causes data loss | Local state corruption on mutations | Fix as part of this change — all `_id` refs replaced with `id` (both groups and documents) |
| Owner locked out of private group | Can't access own group | Migration uses owner's actual roles; if only `['user']`, group is accessible to all users (safe default) |
| Orphaned groups (deleted owner) | Migration crashes or sets empty roles | Fallback to `['user']` when owner not found in JOIN |
| Old owner loses access after transfer | Can't view own group anymore | Expected behavior — old owner retains access if their roles overlap with group roles. Document this in code comments. |

---

## Review Findings (Round 1) — 2026-04-29

Review by sub-agent identified 15 issues. Critical and high-severity items addressed:

**Fixed in plan:**
- `getGroupAccessibleDocuments` now takes both `userId` AND `userRoles` (was taking only userRoles)
- Migration script runs BEFORE dropping old columns (ALTER TABLE ADD, then migrate, then DROP)
- Orphaned groups handled with `['user']` fallback
- `transferOwnership` includes access check for new owner via JSON_OVERLAPS
- Frontend: `isAdmin` computed replaces `isEditor`; document `_id` refs covered; `activeTab` default updated
- Dead functions (`getVisibilitySeverity`, `getMemberCount`, `getRoleSeverity`) marked for removal
- Role validation import noted for updateGroup
- Empty roles array validation specified
- Unnecessary Knex transaction wrappers flagged for removal (createGroup, transferOwnership)

**Deferred/noted:**
- `roles(10)` prefix index effectiveness — kept to match existing tools table pattern; not critical for small tables
- `.agents/plans/tmp/` stale files — gitignored, no action needed unless referenced as context

---

## Timeline Estimate

| Phase | Estimated effort | Notes |
|-------|-----------------|-------|
| 1. Schema + migration | 30 min | Straightforward SQL changes |
| 2. Service refactor | 45 min | Most complex phase — multiple function changes |
| 3. Routes + controller | 20 min | Mostly removals and param changes |
| 4. Cascade deletion | 15 min | Copy existing pattern, adapt for groups |
| 5. Frontend store | 20 min | Remove actions, fix _id bug |
| 6. Frontend view | 30 min | UI restructuring, role checkboxes |
| 7. Documentation | 30 min | Update/delete 11 doc files |
| **Total** | ~4 hours | Phases 1-4 can run in parallel with 5-7 |

---

## Testing Checklist

- [ ] Create group with roles works
- [ ] User with matching role sees group in list
- [ ] User without matching role gets 404 on direct access
- [ ] Owner can edit/delete group
- [ ] Admin can edit/delete any group
- [ ] Non-owner, non-admin gets 403 on mutation
- [ ] Delete custom role cascades to groups correctly
- [ ] RAG search includes documents from accessible groups
- [ ] Frontend create dialog shows role checkboxes
- [ ] Frontend edit dialog updates roles correctly
- [ ] Group card displays roles badges (not visibility)
- [ ] Members tab removed from UI
