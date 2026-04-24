tags: [documents, groups, rbac, transactions]
role: backend-developer

# Document Group Functions

Documented from `src/services/documentGroupService.js`. The document group service manages shared collections of RAG documents with role-based access control, ownership transfer, and MongoDB transaction support.

## createGroup(userId, name, description)

Creates a new DocumentGroup with the calling user as owner. Uses MongoDB session transactions for atomicity.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | ObjectId | Owner of the group |
| name | String | Unique group name (validated unique per account) |
| description | String | Optional group description |

**Process:**

```
  createGroup(userId, name, description)
        │
  Start MongoDB session + transaction
        │
  ┌─────▼──────────────────────────────────┐
  │ DocumentGroup.create([{                │
  │   name, description,                    │
  │   owner_id: userId,                    │
  │   visibility: 'private',               │
  │   members: [{ user_id: userId,         │
  │              role: 'owner' }]          │
  │ }], { session })                       │
├──────────────────────────────────────────┤
│ Commit transaction                       │
│ End session                              │
└──────────────────────────────────────────┘
        │
  ┌─────▼──────────────────────────────────┐
  │ Error handling:                        │
  │   code 11000 (duplicate key) →         │
  │   throw "A group with this name       │
  │   already exists for your account"     │
└──────────────┬───────────────────────────┘
               │
  Return { success: true, data: group }
```

**Returns:** `{ success: true, data: group }` — the created DocumentGroup with `owner_id`, `visibility: 'private'`, and initial `members` array containing the creator as owner.

**Throws:** Duplicate key error (MongoDB code 11000) is re-thrown as a user-friendly message.

## updateGroup(groupId, userId, updateData)

Edits group properties. Requires `canEdit()` permission (owner or editor role).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to update |
| userId | ObjectId | User making the change |
| updateData | Object | Fields to update |

**Allowed fields:** `name`, `description`, `visibility`. Other fields are silently ignored.

**Process:**
1. Loads group by ID
2. Checks `group.canEdit(userId)` — throws if insufficient permissions
3. Applies allowed fields from `updateData`
4. Saves the group

**Returns:** `{ success: true, data: group }`.

## deleteGroup(groupId, userId)

Removes a document group. Requires `isOwner()` check — only the owner can delete.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to delete |
| userId | ObjectId | User attempting deletion |

**Process:**
1. Loads group by ID
2. Checks `group.isOwner(userId)` — throws if not owner
3. Calls `DocumentGroup.findByIdAndDelete(groupId)`

**Returns:** `{ success: true }`.

## addMember(groupId, userId, memberUserId, role)

Adds a user as a member of a document group. Owner-only action.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| groupId | ObjectId | — | Group to add member to |
| userId | ObjectId | — | User making the change (must be owner) |
| memberUserId | ObjectId | — | User to add as member |
| role | String | `'viewer'` | Member role |

**Validations:**
- Caller must be `isOwner()`
- Role cannot be `'owner'` (only the creator can be owner)
- Target user must exist in the User collection
- Target user must not already be a member

**Process:** Pushes `{ user_id: memberUserId, role }` to `group.members`, saves.

**Returns:** `{ success: true, data: group }`.

## removeMember(groupId, userId, memberUserId)

Removes a member from a group. Owner or self-removal allowed.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to remove from |
| userId | ObjectId | User making the change |
| memberUserId | ObjectId | User to remove |

**Validations:**
- Caller must be `isOwner()` OR removing themselves (`userId === memberUserId`)
- Cannot remove yourself as owner — requires ownership transfer first
- Target must exist in members array

**Process:** Finds member by index, removes with `splice()`, saves.

**Returns:** `{ success: true, data: group }`.

## transferOwnership(groupId, userId, newOwnerId)

Transfers group ownership using a MongoDB transaction. Old owner becomes viewer; new owner must be an existing member.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to transfer |
| userId | ObjectId | Current owner requesting transfer |
| newOwnerId | ObjectId | User to become new owner |

**Transaction flow:**

```
  transferOwnership(groupId, userId, newOwnerId)
        │
  Start MongoDB session + transaction
        │
  ┌─────▼──────────────────────────────────┐
  │ Load group within transaction:         │
  │   findById(groupId).session(session)   │
├──────────────────────────────────────────┤
│ Validate:                                │
│   caller is current owner                │
│   new owner is not already owner         │
│   new owner is existing member           │
├──────────────────────────────────────────┤
│ Update group.owner_id = newOwnerId       │
│                                          │
│ Find old owner in members:               │
│   Set role = 'viewer' (or add if missing)│
│                                          │
│ Find new owner in members:               │
│   Set role = 'owner' (or add if missing) │
├──────────────────────────────────────────┤
│ group.save({ session })                  │
│ session.commitTransaction()              │
│ session.endSession()                     │
└──────────────┬───────────────────────────┘
               │
  Return { success: true, data: group }
```

**Returns:** `{ success: true, data: group }` with updated ownership.

## addDocumentToGroup(groupId, userId, documentId)

Adds a RAGDocument reference to a group's documents array. Requires `canEdit()` permission.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to add document to |
| userId | ObjectId | User adding the document |
| documentId | ObjectId | Document to add |

**Validations:**
- Caller must have `canEdit()` permission on the group
- Document must exist in RAGDocument collection
- Document must belong to the caller (`document.user_id === userId`) — users can only add their own documents
- Document must not already be in the group

**Process:** Pushes `{ document_id, added_by, added_at }` to `group.documents`, saves.

**Returns:** `{ success: true, data: group }`.

## removeDocumentFromGroup(groupId, userId, documentId)

Removes a document reference from a group. Requires `canEdit()` permission.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to remove from |
| userId | ObjectId | User removing the document |
| documentId | ObjectId | Document to remove |

**Validations:**
- Caller must have `canEdit()` permission
- Document must exist in the group's documents array

**Process:** Finds document ref by index, removes with `splice()`, saves.

**Returns:** `{ success: true, data: group }`.

## getGroupAccessibleDocuments(userId)

Combines personal indexed documents and group-owned documents into a single deduplicated list.

**Merge flow:**

```
  getGroupAccessibleDocuments(userId)
        │
  ┌─────────────────┐     ┌─────────────────┐
  │ Personal docs    │     │ User's groups    │
  │ RAGDocument.find │     │ DocumentGroup.find│
  │ (user_id, status:│     │ (owner_id OR     │
  │  'indexed')      │     │  member.user_id) │
  └────────┬────────┘     └────────┬──────────┘
           │                        │
           │                        ▼
           │               Collect unique doc IDs
           │               from all group documents
           │                        │
           │                        ▼
           │               RAGDocument.find(_id IN docIds)
           │                 (status: 'indexed')
           │                        │
           └────────┬───────────────┘
                    │
          ┌─────────▼──────────┐
          │ Merge via Map:     │
          │   Key = doc._id    │
          │   Value = doc +    │
          │     source field   │
          │                     │
          │   Personal docs    │
          │   → source: 'personal'│
          │   Group docs       │
          │   → source: 'group' │
          │                     │
          │   Deduplication:   │
          │   personal takes   │
          │   priority over    │
          │   group if same    │
          │   doc appears in   │
          │   both              │
          └─────────┬──────────┘
                    │
          Return { success: true, data: [...] }
```

**Returns:** `{ success: true, data: [...] }` — array of RAGDocument objects with an added `source` field (`'personal'` or `'group'`). Only documents with `status: 'indexed'` are included.

## getGroupDocuments(groupId)

Populates RAGDocument references from a group's documents array and returns the full document objects.

**Parameters:** `groupId` — the DocumentGroup ID.

**Process:** Uses Mongoose `.populate()` on `documents.document_id`, selecting only `filename`, `file_type`, `status`, `metadata` fields.

**Returns:** `{ success: true, data: [...] }` — array of RAGDocument objects with `filename`, `file_type`, `status`, `metadata`. Null entries and empty references are filtered out.

## DocumentGroup Schema

```
  ┌─────────────────────────────────────────────┐
  │              DocumentGroup                   │
  ├─────────────────────────────────────────────┤
  │ _id: ObjectId                               │
  │ name: String (unique per account)           │
  │ description: String                         │
  │ owner_id: ObjectId → User                  │
  │ visibility: 'private' (default)             │
  │                                             │
  │ members: [                                 │
  │   {                                         │
  │     user_id: ObjectId → User,              │
  │     role: 'owner' | 'editor' | 'viewer'    │
  │   }                                        │
  │ ]                                          │
  │                                             │
  │ documents: [                               │
  │   {                                         │
  │     document_id: ObjectId → RAGDocument,   │
  │     added_by: ObjectId → User,             │
  │     added_at: Date                         │
  │   }                                        │
  │ ]                                          │
  └─────────────────────────────────────────────┘

  Methods on DocumentGroup document:
    canEdit(userId)  — returns true for owner or editor
    isOwner(userId)  — returns true if userId === owner_id
```

## Permission Matrix

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| Update group (name/desc/visibility) | Yes (`canEdit`) | Yes (`canEdit`) | No |
| Delete group | Yes (`isOwner`) | No | No |
| Add member | Yes (`isOwner`) | No | No |
| Remove member | Yes (`isOwner`) or self | No | Self only |
| Transfer ownership | Yes (`isOwner`) | No | No |
| Add document | Yes (`canEdit`) | Yes (`canEdit`) | No |
| Remove document | Yes (`canEdit`) | Yes (`canEdit`) | No |
