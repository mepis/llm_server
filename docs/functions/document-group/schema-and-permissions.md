tags: [documents, groups, rbac]
role: backend-developer

# Document Group Schema and Permissions

## DocumentGroup Schema (MariaDB)

```
  +-----------------------------------------------------------+
  |                    document_groups                         |
  +-----------------------------------------------------------+
  | id:          VARCHAR(36) PRIMARY KEY                       |
  | name:        VARCHAR(100) NOT NULL                         |
  | description: TEXT DEFAULT ''                               |
  | owner_id:    VARCHAR(36) NOT NULL                          |
  | roles:       JSON DEFAULT '["user"]'                       |
  | documents:   JSON DEFAULT '[]'                             |
  | created_at:  TIMESTAMP                                     |
  | updated_at:  TIMESTAMP                                     |
  +-----------------------------------------------------------+

  Indexes:
    idx_owner_id (owner_id)
    idx_roles (roles(10))
    idx_name_owner (name, owner_id) UNIQUE

  Access check: JSON_OVERLAPS(group.roles, user.roles)
```

## Permission Matrix

| Action | Owner | Admin | Non-owner with matching role |
|--------|-------|-------|------------------------------|
| View group (via roles overlap) | Yes | Yes | Yes (if roles overlap) |
| Update group (name/desc/roles) | Yes | Yes | No |
| Delete group | Yes | Yes | No |
| Transfer ownership | Yes | Yes | No |
| Add document | Yes | Yes | No |
| Remove document | Yes | Yes | No |

## Access Control Model

Groups use RBAC roles for visibility. A user can access any group where their user roles overlap with the group's required roles via `JSON_OVERLAPS(group.roles, user.roles)`. This follows the same pattern as the tools table.

- **Visibility**: Controlled by `roles` JSON column (e.g., `["user"]`, `["admin"]`, `["user","admin"]`)
- **Mutations**: Only group owner or global admin can modify groups and their documents
- **Ownership transfer**: New owner must have overlapping roles with the group to ensure they can view it

---
[Back to Index](../index.md)
