tags: [documents, groups, rbac]
role: backend-developer

# addDocumentToGroup(groupId, userId, documentId)

Adds a RAGDocument reference to a group's documents array. Requires `canEdit()` permission.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| groupId | ObjectId | Group to add document to |
| userId | ObjectId | User adding the document |
| documentId | ObjectId | Document to add |

**Validations:**
- Caller must have `canEdit()` permission on the group
- Document must exist in RAGDocument collection
- Document must belong to the caller (`document.user_id === userId`) — users can only add their own documents
- Document must not already be in the group

**Process:** Pushes `{ document_id, added_by, added_at }` to `group.documents`, saves.

**Returns:** `{ success: true, data: group }`.

---
[Back to Document Group Functions](./document-group-functions.md)
