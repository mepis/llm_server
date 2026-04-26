tags: [documents, groups, rbac]
role: backend-developer

# deleteGroup(groupId, userId)

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

---
[Back to Document Group Functions](./document-group-functions.md)
