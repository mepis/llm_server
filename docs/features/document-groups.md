tags: [document-groups, rag, collaboration, rbac]
role: [developer, admin]

# Document Groups

Collaborative document organization with RBAC role-based visibility.

## Overview

DocumentGroups allow users to organize RAG documents into named collections with role-based access control. Each group has an owner and a `roles` JSON column that defines which user roles can view the group. Access is determined via `JSON_OVERLAPS(group.roles, user.roles)`, following the same pattern as the tools table.

Documents are stored as references in MariaDB. The group owner and global admins can modify groups and manage documents.

**Base path:** `/api/document-groups`

## DocumentGroup Schema

```
+-----------------------------------------------------------+
| document_groups (MariaDB)                                 |
+-----------------------------------------------------------+
| id           VARCHAR(36) PRIMARY KEY                       |
| name         VARCHAR(100) NOT NULL                         |
| description  TEXT DEFAULT ''                               |
| owner_id     VARCHAR(36) NOT NULL                          |
| roles        JSON DEFAULT '["user"]'                       |
| documents    JSON DEFAULT '[]'                             |
| created_at   TIMESTAMP                                     |
| updated_at   TIMESTAMP                                     |
+-----------------------------------------------------------+

Indexes:
- idx_owner_id (owner_id)
- idx_roles (roles(10))
- idx_name_owner (name, owner_id) UNIQUE — prevents duplicate group names per user
```

## Schema Diagram

```
+--------------------------+        +----------------------------------+
| document_groups          |        | rag_documents                    |
+--------------------------+        +----------------------------------+
| id: "grp_abc123"        |<-------| id: "doc_xyz789"                |
| name: "Project Alpha"   |  ref   | filename: "spec.pdf"            |
| description: "..."      |        | file_type: "pdf"                |
| owner_id: "user_123"    |        | user_id: "user_456"             |
| roles: ["user","admin"] |        | status: "indexed"               |
|                          |        +----------------------------------+
| documents: [             |
|   {                     |
|     document_id: "doc1",|
|     added_by: "user1",  |
|     added_at: Date      |
|   }                     |
| ]                       |
+--------------------------+

Access check: JSON_OVERLAPS(group.roles, user.roles)
```

## Role-Based Access Model

Groups define which user roles can view them via the `roles` JSON column:

| Group Roles | Who Can View | Example |
|---|---|---|
| `["user"]` | Any authenticated user | Public-like group |
| `["admin"]` | Admins only | Restricted group |
| `["user","admin"]` | All users + admins | Open group |

**Mutation permissions:** Only the group owner or global admin can edit/delete groups and add/remove documents.

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
{ "name": "Project Alpha", "description": "Shared docs", "roles": ["user"] }
```

- Creates with default `roles: ["user"]` if not specified
- Duplicate group name for same user returns 409

**Response:** Created group object.

### List Groups

```
GET /api/document-groups
Authorization: Bearer <token>
```

Returns groups where the user's roles overlap with the group's `roles` column via `JSON_OVERLAPS()`.

### Get Single Group

```
GET /api/document-groups/:id
Authorization: Bearer <token>
```

Returns group if the user has access (roles overlap). Returns 404 otherwise.

### Update Group

```
PATCH /api/document-groups/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:** Partial update with allowed fields.

```json
{ "name": "Updated Name", "roles": ["admin"] }
```

Allowed fields: `name`, `description`, `roles`. Requires owner or admin permission. Roles are validated against existing roles in the system.

### Delete Group

```
DELETE /api/document-groups/:id
Authorization: Bearer <token>
```

Only the owner or admin can delete a group.

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

- Only current owner or admin can initiate
- New owner must have overlapping roles with the group (can view it)
- Old owner retains read access if their user roles overlap with group roles

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

- Requires owner or admin permission
- Can only add documents owned by the requesting user
- Duplicate detection prevents adding same document twice

### Remove Document from Group

```
DELETE /api/document-groups/:id/documents/:did
Authorization: Bearer <token>
```

Requires owner or admin permission.

### Get Accessible Documents

```
GET /api/document-groups/accessible
Authorization: Bearer <token>
```

Returns all indexed RAGDocuments accessible to the user — both personal documents and documents from groups the user can access via role overlap. Each document includes a `source` field (`"personal"` or `"group"`).

## Group CRUD Flow

```
POST /api/document-groups
        |
        v
+--------------------------+
| Validate:                |
| - name is non-empty      |
| - roles is valid array   |
+--------------------------+
        |
        v
+------------------------+
| INSERT INTO            |
| document_groups:       |
| - id (UUID)           |
| - name, description    |
| - owner_id             |
| - roles (JSON)         |
+------------------------+
        | success
        v
  Return group object

Error handling:
  ER_DUP_ENTRY -> "Group name already exists"
  Other errors -> return error message
```

## Ownership Transfer Flow

```
POST /api/document-groups/:id/transfer
        |
        v
+-----------------------------+
| Validate:                 |
| - requester is owner/admin |
| - new_owner exists         |
| - new_owner has overlapping|
|   roles with group         |
+-----------------------------+
        | pass
        v
+----------------------------------+
| UPDATE document_groups           |
|   SET owner_id = newOwnerId      |
|   WHERE id = groupId             |
+----------------------------------+
        |
        v
  Return updated group

Error handling:
  Any validation failure -> return error message
```

## Service Methods

All methods in `documentGroupService` wrap responses in `{ success: true, data: ... }`.

| Method | Key Details |
|---|---|
| `createGroup(userId, name, desc, roles)` | Inserts group with roles JSON |
| `getUserGroups(userRoles)` | Queries via JSON_OVERLAPS |
| `updateGroup(groupId, userId, data)` | Validates owner/admin, validates roles |
| `deleteGroup(groupId, userId)` | Owner or admin check |
| `transferOwnership(groupId, userId, newOwnerId)` | Ownership transfer with access check |
| `addDocumentToGroup(groupId, userId, docId)` | Owner/admin + own-doc-only check |
| `removeDocumentFromGroup(groupId, userId, docId)` | Owner/admin check |
| `getGroupAccessibleDocuments(userId, userRoles)` | Personal + group docs merged via JSON_OVERLAPS |
| `getGroupDocuments(groupId)` | Returns document references for a group |

## Related Pages

- [RAG System](./rag-system.md) — underlying document storage and search
- [Role Management](./role-management.md) — RBAC roles used for group visibility
- [API Reference](../api/api-endpoints.md)
