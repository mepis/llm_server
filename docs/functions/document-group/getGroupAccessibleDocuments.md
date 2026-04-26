tags: [documents, groups, rbac]
role: backend-developer

# getGroupAccessibleDocuments(userId)

Combines personal indexed documents and group-owned documents into a single deduplicated list.

**Merge flow:**

```
  getGroupAccessibleDocuments(userId)
        │
  ┌─────────────────┐     ┌─────────────────┐
  │ Personal docs    │     │ User's groups    │
  │ RAGDocument.find │     │ DocumentGroup.find│
  │ (user_id, status:│     │ (owner_id OR     │
  │  'indexed')      │     │  member.user_id) │
  └────────┬────────┘     └────────┬──────────┘
           │                        │
           │                        ▼
           │               Collect unique doc IDs
           │               from all group documents
           │                        │
           │                        ▼
           │               RAGDocument.find(_id IN docIds)
           │                 (status: 'indexed')
           │                        │
           └────────┬───────────────┘
                    │
           ┌─────────▼──────────┐
           │ Merge via Map:     │
           │   Key = doc._id    │
           │   Value = doc +    │
           │     source field   │
           │                     │
           │   Personal docs    │
           │   → source: 'personal'│
           │   Group docs       │
           │   → source: 'group' │
           │                     │
           │   Deduplication:   │
           │   personal takes   │
           │   priority over    │
           │   group if same    │
           │   doc appears in   │
           │   both              │
           └─────────┬──────────┘
                    │
           Return { success: true, data: [...] }
```

**Returns:** `{ success: true, data: [...] }` — array of RAGDocument objects with an added `source` field (`'personal'` or `'group'`). Only documents with `status: 'indexed'` are included.

---
[Back to Document Group Functions](./document-group-functions.md)
