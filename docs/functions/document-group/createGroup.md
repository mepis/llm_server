tags: [documents, groups, rbac, transactions]
role: backend-developer

# createGroup(userId, name, description)

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

---
[Back to Document Group Functions](./document-group-functions.md)
