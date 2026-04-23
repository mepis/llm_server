# Phase 2: Document Groups + RBAC - Detailed Todo List

**Phase**: 2 of 6  
**Dependencies**: Phase 1 (DocumentParser), existing Role model and RBAC middleware  
**Estimated effort**: ~3-4 days  

---

## Purpose

Enable document sharing between users through document groups with role-based access controls. Users can create groups, add members with specific roles (owner/editor/viewer), and associate documents with groups for shared access.

---

## Task 2.1: Create DocumentGroup Model

**File**: `src/models/DocumentGroup.js`

- [ ] Create schema with fields:
  ```javascript
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 }
  description: { type: String, trim: true, default: '' }
  owner_id: { type: ObjectId, ref: 'User', required: true }
  visibility: { type: String, enum: ['private', 'team', 'public'], default: 'private' }
  ```

- [ ] Create members subdocument schema:
  ```javascript
  members: [{
    user_id: { type: ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' }
  }]
  ```

- [ ] Create documents reference array:
  ```javascript
  documents: [{
    document_id: { type: ObjectId, ref: 'RAGDocument', required: true },
    added_by: { type: ObjectId, ref: 'User' },
    added_at: { type: Date, default: Date.now }
  }]
  ```

- [ ] Create indexes:
  - `{ owner_id: 1 }` — fast lookup of user's groups
  - `{ visibility: 1 }` — filter for public/group discovery
  - `{ 'members.user_id': 1 }` — find groups where user is a member

- [ ] Add instance methods:
  - `isOwner(userId)` — check if userId is the group owner
  - `isMember(userId)` — check if userId is any member
  - `getRole(userId)` — return member role or null
  - `canEdit(userId)` — return true if owner or editor
  - `canView(userId)` — return true if member, owner, or public

- [ ] Add static methods:
  - `getUserGroups(userId)` — find all groups where user is a member or owner
  - `getPublicGroups()` — find all public visibility groups

**Acceptance criteria:**
- Schema validates with all field types and constraints
- Indexes exist on correct fields (verify with `Model.getIndexes()`)
- isOwner/isMember/getRole/canEdit/canView return correct results for each case

---

## Task 2.2: Create DocumentGroup Service

**File**: `src/services/documentGroupService.js`

- [ ] Implement `createGroup(userId, name, description)`:
  - Creates group with userId as owner
  - Adds owner to members array automatically
  - Returns created group

- [ ] Implement `updateGroup(groupId, userId, updateData)`:
  - Validates user has edit permission (owner or editor)
  - Updates name, description, visibility
  - If visibility changes from private→public, notify all members conceptually

- [ ] Implement `deleteGroup(groupId, userId)`:
  - Only owner can delete
  - Removes group but does NOT delete associated documents
  - Documents remain owned by their original owners

- [ ] Implement `addMember(groupId, userId, role)`:
  - Validates requester is owner or admin
  - Checks user isn't already a member
  - Adds to members array with specified role
  - Prevent adding 'owner' role (only creator can be owner)

- [ ] Implement `removeMember(groupId, userId)`:
  - Only owner can remove (or self-remove as non-owner)
  - Owner cannot remove themselves — requires transferring ownership first
  - Remove from members array

- [ ] Implement `transferOwnership(groupId, newOwnerId, requesterId)`:
  - Only current owner can transfer
  - New owner must already be a member
  - Updates group.owner_id
  - Removes old owner from members (or keeps as viewer if specified)

- [ ] Implement `addDocumentToGroup(groupId, documentId, userId)`:
  - Validates requester has edit permission on group
  - Validates requester owns the document OR is admin
  - Adds document_id to documents array (check for duplicates)
  - Note: ownership of RAGDocument remains unchanged

- [ ] Implement `removeDocumentFromGroup(groupId, documentId, userId)`:
  - Validates requester has edit permission on group
  - Removes document from documents array

- [ ] Implement `getGroupAccessibleDocuments(userId)`:
  - Gets all documents the user owns (user_id = userId)
  - Gets all documents from groups where user is a member
  - Gets all documents from public groups
  - Returns deduplicated list with source info

- [ ] Implement `getGroupDocuments(groupId)`:
  - Returns documents array for a specific group
  - Populates full RAGDocument objects via populate

**Acceptance criteria:**
- Create group → owner can add members, edit, delete
- Editor can't delete group or change visibility
- Viewer can see group docs but can't add/remove them
- Owner cannot remove themselves (must transfer ownership first)
- Document added to group is accessible from all group member searches

---

## Task 2.3: Create DocumentGroup Controller

**File**: `src/controllers/documentGroupController.js`

- [ ] Implement `createGroup(req, res)`:
  - POST /api/document-groups
  - Extract name, description from body
  - Call documentGroupService.createGroup(userId, name, description)
  
- [ ] Implement `getGroups(req, res)`:
  - GET /api/document-groups
  - List all groups where user is member or owner
  
- [ ] Implement `getGroup(req, res)`:
  - GET /api/document-groups/:id
  - Validate access (owner/member/public)
  - Return group with populated documents
  
- [ ] Implement `updateGroup(req, res)`:
  - PATCH /api/document-groups/:id
  - Validate edit permission
  - Apply updates from body
  
- [ ] Implement `deleteGroup(req, res)`:
  - DELETE /api/document-groups/:id
  - Validate owner permission
  
- [ ] Implement `addMember(req, res)`:
  - POST /api/document-groups/:id/members
  - Body: { user_id, role }
  - Validate owner/admin permission
  
- [ ] Implement `removeMember(req, res)`:
  - DELETE /api/document-groups/:id/members/:uid
  - Validate owner/self permission
  
- [ ] Implement `transferOwnership(req, res)`:
  - POST /api/document-groups/:id/transfer
  - Body: { new_owner_id }
  - Validate current owner permission
  
- [ ] Implement `addDocumentToGroup(req, res)`:
  - POST /api/document-groups/:id/documents
  - Body: { document_id }
  - Validate edit + ownership permissions
  
- [ ] Implement `removeDocumentFromGroup(req, res)`:
  - DELETE /api/document-groups/:id/documents/:did
  - Validate edit permission

**Acceptance criteria:**
- All endpoints return `{ success: true, data: ... }` format
- Unauthorized requests return 403 with 'Insufficient permissions'
- Not found requests return 404
- Body validation rejects missing required fields with 400

---

## Task 2.4: Create Routes

**File**: `src/routes/documentGroups.js`

- [ ] Define all routes with authMiddleware:
  ```javascript
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');
  const documentGroupController = require('../controllers/documentGroupController');
  
  router.post('/', authMiddleware, documentGroupController.createGroup);
  router.get('/', authMiddleware, documentGroupController.getGroups);
  router.get('/:id', authMiddleware, documentGroupController.getGroup);
  router.patch('/:id', authMiddleware, documentGroupController.updateGroup);
  router.delete('/:id', authMiddleware, documentGroupController.deleteGroup);
  router.post('/:id/members', authMiddleware, documentGroupController.addMember);
  router.delete('/:id/members/:uid', authMiddleware, documentGroupController.removeMember);
  router.post('/:id/transfer', authMiddleware, documentGroupController.transferOwnership);
  router.post('/:id/documents', authMiddleware, documentGroupController.addDocumentToGroup);
  router.delete('/:id/documents/:did', authMiddleware, documentGroupController.removeDocumentFromGroup);
  
  module.exports = router;
  ```

- [ ] Register in `src/routes/api.js`:
  ```javascript
  const documentGroupRoutes = require('./documentGroups');
  router.use('/document-groups', documentGroupRoutes);
  ```

**Acceptance criteria:**
- All routes registered and accessible at `/api/document-groups/*`
- Routes protected by authMiddleware (401 without token)
- Route file follows existing pattern from other route files

---

## Task 2.5: Update ragService.searchDocuments()

**File**: `src/services/ragService.js`

- [ ] Fix signature bug — change from `(userId, query, limit)` to:
  ```javascript
  const searchDocuments = async (userId, query, limit = 10, documentIds = []) => {
  ```

- [ ] Update query filter:
  - If `documentIds` is empty array or not provided: find all documents where user_id === userId OR document is in a group the user has access to
  - If `documentIds` is provided: search only within those specific document IDs

- [ ] For group-accessible documents:
  ```javascript
  // Get all doc IDs accessible via groups
  const groupDocs = await getGroupAccessibleDocuments(userId);
  const accessibleDocIds = [
    ...documentsOwnedByUser.map(d => d._id),
    ...groupDocs.map(d => d._id)
  ];
  ```

- [ ] Search only indexed documents with accessible doc IDs:
  ```javascript
  const documents = await RAGDocument.find({
    user_id: userId,
    status: 'indexed',
    _id: { $in: accessibleDocIds }
  });
  ```

**Acceptance criteria:**
- Search returns documents from both personal ownership and group access
- The bug where array was passed as userId is fixed (now uses proper userId string)
- Empty documentIds array searches all accessible docs
- Specific documentIds filter restricts search scope

---

## Task 2.6: Update RAGDocument Model (additional fields)

**File**: `src/models/RAGDocument.js`

- [ ] Add `group_ids` field:
  ```javascript
  group_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentGroup' }]
  ```

- [ ] Add index:
  ```javascript
  ragDocumentSchema.index({ group_ids: 1, status: 1 });
  ```

- [ ] Add method to check group access:
  ```javascript
  ragDocumentSchema.methods.isAccessibleTo = async function(userId) {
    if (this.user_id.toString() === userId) return true;
    if (this.group_ids.length === 0) return false;
    const DocumentGroup = mongoose.model('DocumentGroup');
    for (const groupId of this.group_ids) {
      const group = await DocumentGroup.findById(groupId);
      if (group && group.canView(userId)) return true;
    }
    return false;
  };
  ```

**Acceptance criteria:**
- RAGDocument can reference multiple groups
- isAccessibleTo method correctly checks ownership and group membership

---

## Notes for Implementers

- DocumentGroup members array stores user_ids — do NOT use the Role model (different concept: group roles vs system roles)
- The `visibility` field on DocumentGroup controls discoverability, not access control. Access is via members array + canView() method.
- When adding a document to a group, the document's ownership does NOT change. group_ids is just a reference list.
- Consider pagination for `getGroups()` and `getGroupAccessibleDocuments()` — large numbers of groups/docs need paging
