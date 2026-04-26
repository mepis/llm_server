tags: [documents, groups, rbac]
role: backend-developer

# removeMember(groupId, userId, memberUserId)

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

---
[Back to Document Group Functions](./document-group-functions.md)
