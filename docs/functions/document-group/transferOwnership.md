tags: [documents, groups, rbac, transactions]
role: backend-developer

# transferOwnership(groupId, userId, newOwnerId)

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

---
[Back to Document Group Functions](./document-group-functions.md)
