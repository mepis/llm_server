tags: [documents, groups, rbac]
role: backend-developer

# updateGroup(groupId, userId, updateData)

Edits group properties. Requires owner or admin permission.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | String (UUID) | Group to update |
| userId | String (UUID) | User making the change |
| updateData | Object | Fields to update |

**Allowed fields:** `name`, `description`, `roles`. Other fields are silently ignored.

When updating `roles`:
- Must be a non-empty array
- Each role is validated via `roleService.isValidRole()` (checks against built-in roles + existing custom roles)
- Array is stringified to JSON before persisting

**Process:**
1. Loads group by ID
2. Checks user is owner or has admin role — throws if insufficient permissions
3. Validates `roles` array if provided
4. Applies allowed fields from `updateData`
5. Updates the group in DB

**Returns:** `{ success: true, data: group }`.

---
[Back to Document Group Functions](./document-group-functions.md)
