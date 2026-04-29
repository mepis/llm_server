tags: [documents, groups, rbac]
role: backend-developer

# getGroupAccessibleDocuments(userId, userRoles)

Combines personal indexed documents and group-accessible documents into a single deduplicated list. Uses `JSON_OVERLAPS()` for role-based group access.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | String (UUID) | For querying personal documents |
| userRoles | String[] | User's roles array for JSON_OVERLAPS query |

**Merge flow:**

```
  getGroupAccessibleDocuments(userId, userRoles)
        |
  +-------------------+     +------------------------+
  | Personal docs      |     | Accessible groups       |
  | RAGDocument find   |     | document_groups find    |
  | (user_id, status:  |     | WHERE JSON_OVERLAPS(    |
  |  'indexed')        |     |   roles, userRoles)     |
  +---------+----------+     +------------+-------------+
            |                          |
            |                          v
            |               Collect unique doc IDs
            |               from all group documents
            |                          |
            |                          v
            |               RAGDocument find(id IN docIds)
            |                 (status: 'indexed')
            |                          |
            +----------+---------------+
                       |
            +-----------v--------------+
            | Merge via Map:           |
            |   Key = doc.id           |
            |   Value = doc + source   |
            |                          |
            |   Personal docs          |
            |   -> source: 'personal'  |
            |   Group docs             |
            |   -> source: 'group'     |
            |                          |
            |   Deduplication:         |
            |   personal takes priority|
            |   over group if same doc |
            |   appears in both        |
            +-----------+--------------+
                       |
            Return { success: true, data: [...] }
```

**Returns:** `{ success: true, data: [...] }` — array of RAGDocument objects with an added `source` field (`'personal'` or `'group'`). Only documents with `status: 'indexed'` are included.

---
[Back to Document Group Functions](./document-group-functions.md)
