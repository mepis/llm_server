tags: [documents, groups, rbac]
role: backend-developer

# transferOwnership(groupId, userId, newOwnerId)

Transfers group ownership. New owner must have overlapping roles with the group to ensure they can view it.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | String (UUID) | Group to transfer |
| userId | String (UUID) | Current owner requesting transfer |
| newOwnerId | String (UUID) | User to become new owner |

**Process:**

```
  transferOwnership(groupId, userId, newOwnerId)
        |
  Load group from DB
        |
  +-------------------------------------------+
  | Validate:                                 |
  |   caller is current owner or admin        |
  |   new owner is not already owner          |
  |   new owner exists in users table         |
  |   new owner has overlapping roles with    |
  |     the group (JSON_OVERLAPS check)       |
  +-------------------------------------------+
        |
  UPDATE document_groups
    SET owner_id = newOwnerId,
        updated_at = NOW()
    WHERE id = groupId
        |
  Fetch updated group
        |
  Return { success: true, data: group }
```

**Notes:**
- After transfer, the old owner loses mutation privileges but retains read access if their user roles overlap with the group's roles
- No member manipulation needed — the members concept has been removed in favor of role-based visibility

**Returns:** `{ success: true, data: group }` with updated ownership.

---
[Back to Document Group Functions](./document-group-functions.md)
