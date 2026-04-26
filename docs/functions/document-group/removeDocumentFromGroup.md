tags: [documents, groups, rbac]
role: backend-developer

# removeDocumentFromGroup(groupId, userId, documentId)

Removes a document reference from a group. Requires `canEdit()` permission.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to remove from |
| userId | ObjectId | User removing the document |
| documentId | ObjectId | Document to remove |

**Validations:**
- Caller must have `canEdit()` permission
- Document must exist in the group's documents array

**Process:** Finds document ref by index, removes with `splice()`, saves.

**Returns:** `{ success: true, data: group }`.

---
[Back to Document Group Functions](./document-group-functions.md)
