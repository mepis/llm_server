tags: [documents, groups, rbac]
role: backend-developer

# createGroup(userId, name, description, roles)

Creates a new DocumentGroup with the calling user as owner.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | String (UUID) | Owner of the group |
| name | String | Unique group name (validated unique per account) |
| description | String | Optional group description |
| roles | String[] | RBAC roles array for visibility (default: `["user"]`) |

**Process:**

```
  createGroup(userId, name, description, roles)
        |
  Validate roles is non-empty array (fallback to ["user"])
        |
  +-------------------------------------------+
  | INSERT INTO document_groups ({            |
  |   id: uuid(),                             |
  |   name, description,                      |
  |   owner_id: userId,                       |
  |   roles: JSON.stringify(roles)           |
  | })                                        |
  +-------------------------------------------+
        |
  Fetch created group from DB
        |
  Return { success: true, data: group }
```

**Returns:** `{ success: true, data: group }` — the created group with `owner_id`, `roles` JSON array, and empty `documents` array.

**Throws:** Duplicate key error (MariaDB `ER_DUP_ENTRY`) is re-thrown as "A group with this name already exists for your account".

---
[Back to Document Group Functions](./document-group-functions.md)
