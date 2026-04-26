tags: [documents, groups, rbac]
role: backend-developer

# addMember(groupId, userId, memberUserId, role)

Adds a user as a member of a document group. Owner-only action.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| groupId | ObjectId | — | Group to add member to |
| userId | ObjectId | — | User making the change (must be owner) |
| memberUserId | ObjectId | — | User to add as member |
| role | String | `'viewer'` | Member role |

**Validations:**
- Caller must be `isOwner()`
- Role cannot be `'owner'` (only the creator can be owner)
- Target user must exist in the User collection
- Target user must not already be a member

**Process:** Pushes `{ user_id: memberUserId, role }` to `group.members`, saves.

**Returns:** `{ success: true, data: group }`.

---
[Back to Document Group Functions](./document-group-functions.md)
