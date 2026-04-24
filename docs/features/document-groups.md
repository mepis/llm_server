tags: [document-groups, rag, collaboration]
role: [developer, admin]

# Document Groups

Collaborative document organization with visibility controls and role-based access.

## Overview

DocumentGroups allow users to organize RAG documents into named collections with shared access. Each group has an owner, configurable members with roles (owner/editor/viewer), and visibility settings (private/team/public). Documents are stored as references in the `RAGDocument` collection. MongoDB transactions ensure consistency during creation and ownership transfer.

**Base path:** `/api/document-groups`

## DocumentGroup Model

```
+-----------------------------------------------------------+
| DocumentGroup                                             |
+-----------------------------------------------------------+
| _id          ObjectId                                     |
| name         String (max 100)                             |
| description  String                                       |
| owner_id     ObjectId -> User                             |
| visibility   Enum: private, team, public                  |
| members      [{ user_id -> User, role }]                  |
| documents    [{ document_id -> RAGDocument, added_by,     |
|                added_at }]                                |
| created_at   Date                                         |
| updated_at   Date                                         |
+-----------------------------------------------------------+

Indexes:
- owner_id
- visibility
- members.user_id
- (name, owner_id) unique — prevents duplicate group names per user
```

## Schema Diagram

```
+--------------------------+        +----------------------------------+
| DocumentGroup            |        | RAGDocument (external)          |
+--------------------------+        +----------------------------------+
| _id: "grp_abc123"       |<-------| _id: "doc_xyz789"               |
| name: "Project Alpha"   |  ref   | filename: "spec.pdf"            |
| description: "..."      |        | file_type: "pdf"                |
| owner_id -> User         |        | user_id -> User                 |
| visibility: "team"      |        | status: "indexed"               |
|                          |        +----------------------------------+
| members: [               |
|   {                     |
|     user_id -> User,    |
|     role: "owner"       |
|   },                    |
|   {                     |
|     user_id -> User,    |
|     role: "editor"     |
|   }                     |
| ],                      |
|                          |
| documents: [            |
|   {                     |
|     document_id ->      |
|       RAGDocument,      |
|     added_by -> User,   |
|     added_at: Date      |
|   }                     |
| ]                       |
+--------------------------+
```

## Visibility Levels

| Level | Who Can See | Who Can Edit |
|---|---|---|
| `private` | Owner only | Owner only |
| `team` | Owner + members | Owner + editors |
| `public` | Any authenticated user | Owner + editors |

## Model Methods

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `isOwner(userId)` | userId | boolean | True if userId matches owner_id |
| `isMember(userId)` | userId | boolean | True if userId is in members array |
| `getRole(userId)` | userId | "owner" \| "editor" \| "viewer" \| null | Member role or null |
| `canEdit(userId)` | userId | boolean | True for owner or editor |
| `canView(userId)` | userId | boolean | True for owner, member, or public groups |

### canView() Logic

```
canView(userId):
  if isOwner(userId)      -> true
  if isMember(userId)     -> true
  if visibility == "public" -> true
  else                    -> false
```

## API Endpoints

All endpoints require authentication via `authMiddleware`.

### Create Group

```
POST /api/document-groups
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

```json
{ "name": "Project Alpha", "description": "Shared docs" }
```

- Creates with `visibility: "private"` and owner as first member (role: `"owner"`)
- Uses MongoDB session-based transaction
- Duplicate group name for same user returns 409 (error code 11000)

**Response:** Created DocumentGroup document.

### List Groups

```
GET /api/document-groups
Authorization: Bearer <token>
```

Returns groups where the user is either owner or member.

### Get Single Group

```
GET /api/document-groups/:id
Authorization: Bearer <token>
```

### Update Group

```
PATCH /api/document-groups/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:** Partial update with allowed fields.

```json
{ "name": "Updated Name", "visibility": "team" }
```

Allowed fields: `name`, `description`, `visibility`. Requires `canEdit()` permission.

### Delete Group

```
DELETE /api/document-groups/:id
Authorization: Bearer <token>
```

Only the owner can delete a group.

### Add Member

```
POST /api/document-groups/:id/members
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

```json
{ "user_id": "<userId>", "role": "editor" }
```

- Only the owner can add members
- Cannot assign `"owner"` role (only creator is owner)
- Returns 400 if user already a member or not found

### Remove Member

```
DELETE /api/document-groups/:id/members/:uid
Authorization: Bearer <token>
```

- Owner can remove any member except themselves as owner
- Members can remove themselves
- Cannot remove the owner — transfer ownership first

### Transfer Ownership

```
POST /api/document-groups/:id/transfer
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

```json
{ "new_owner_id": "<userId>" }
```

- Only current owner can initiate
- New owner must already be a member of the group
- Old owner becomes a `"viewer"` if not already in members
- Uses MongoDB session-based transaction

### Add Document to Group

```
POST /api/document-groups/:id/documents
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

```json
{ "document_id": "<ragDocId>" }
```

- Requires `canEdit()` permission
- Can only add documents owned by the requesting user
- Duplicate detection prevents adding same document twice

### Remove Document from Group

```
DELETE /api/document-groups/:id/documents/:did
Authorization: Bearer <token>
```

Requires `canEdit()` permission.

### Get Accessible Documents

```
GET /api/document-groups/accessible
Authorization: Bearer <token>
```

Returns all indexed RAGDocuments accessible to the user — both personal documents and documents from groups the user belongs to. Each document includes a `source` field (`"personal"` or `"group"`).

## Group CRUD Flow

```
POST /api/document-groups
        |
        v
+--------------------------+
| Start MongoDB session    |
| begin transaction        |
+--------------------------+
        |
        v
+------------------------+
| Create DocumentGroup   |
| - name, description    |
| - owner_id             |
| - visibility: private  |
| - members: [owner]     |
+------------------------+
        | success
        v
+--------------------------+
| Commit transaction       |
| end session              |
+--------------------------+
        |
        v
  Return group document

Error handling:
  MongoDB 11000 -> "Group name already exists"
  Other errors -> abort transaction, return error
```

## Ownership Transfer Flow

```
POST /api/document-groups/:id/transfer
        |
        v
+-------------------------+
| Start MongoDB session   |
| begin transaction       |
+-------------------------+
        |
        v
+-----------------------------+
| Validate:                 |
| - requester is owner      |
| - new_owner is member     |
| - new_owner != current    |
+-----------------------------+
        | pass
        v
+----------------------------------+
| Update fields (in transaction):  |
| 1. owner_id = newOwnerId         |
| 2. oldOwner -> role "viewer"     |
| 3. newOwner -> role "owner"      |
+----------------------------------+
        |
        v
+--------------------------+
| Commit transaction       |
| end session              |
+--------------------------+
        |
        v
  Return updated group

Error handling:
  Any validation failure -> abort transaction, return error message
```

## Service Methods

All methods in `DocumentGroupService` wrap the standard API response format `{ success: true, data: ... }`.

| Method | Key Details |
|---|---|
| `createGroup(userId, name, desc)` | Session transaction, private by default |
| `updateGroup(groupId, userId, data)` | Validates canEdit(), limited field updates |
| `deleteGroup(groupId, userId)` | Owner-only check |
| `addMember(groupId, userId, memberUserId, role)` | Owner-only, no owner role assignment |
| `removeMember(groupId, userId, memberUserId)` | Owner or self-removal |
| `transferOwnership(groupId, userId, newOwnerId)` | Session transaction, old owner -> viewer |
| `addDocumentToGroup(groupId, userId, docId)` | canEdit() + own-doc-only check |
| `removeDocumentFromGroup(groupId, userId, docId)` | canEdit() check |
| `getGroupAccessibleDocuments(userId)` | Personal + group docs merged |
| `getGroupDocuments(groupId)` | Populated RAGDocument references |

## Related Pages

- [RAG Documents](./rag-documents.md) — underlying document storage
- [Config Management](./config-management.md) — visibility and access config
- [API Reference](../api/document-groups-api.md)
