tags: [documents, groups, rbac]
role: backend-developer

# updateGroup(groupId, userId, updateData)

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

---
[Back to Document Group Functions](./document-group-functions.md)
