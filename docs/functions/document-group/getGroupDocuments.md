tags: [documents, groups]
role: backend-developer

# getGroupDocuments(groupId)

Populates RAGDocument references from a group's documents array and returns the full document objects.

**Parameters:** `groupId` — the DocumentGroup ID.

**Process:** Uses Mongoose `.populate()` on `documents.document_id`, selecting only `filename`, `file_type`, `status`, `metadata` fields.

**Returns:** `{ success: true, data: [...] }` — array of RAGDocument objects with `filename`, `file_type`, `status`, `metadata`. Null entries and empty references are filtered out.

---
[Back to Document Group Functions](./document-group-functions.md)
