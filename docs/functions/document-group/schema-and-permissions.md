tags: [documents, groups, rbac]
role: backend-developer

# Document Group Schema and Permissions

## DocumentGroup Schema

```
  ┌─────────────────────────────────────────────┐
  │              DocumentGroup                   │
  ├─────────────────────────────────────────────┤
  │ _id: ObjectId                               │
  │ name: String (unique per account)           │
  │ description: String                         │
  │ owner_id: ObjectId → User                  │
  │ visibility: 'private' (default)             │
  │                                             │
  │ members: [                                 │
  │   {                                         │
  │     user_id: ObjectId → User,              │
  │     role: 'owner' | 'editor' | 'viewer'    │
  │   }                                        │
  │ ]                                          │
  │                                             │
  │ documents: [                               │
  │   {                                         │
  │     document_id: ObjectId → RAGDocument,   │
  │     added_by: ObjectId → User,             │
  │     added_at: Date                         │
  │   }                                        │
  │ ]                                          │
  └─────────────────────────────────────────────┘

  Methods on DocumentGroup document:
    canEdit(userId)  — returns true for owner or editor
    isOwner(userId)  — returns true if userId === owner_id
```

## Permission Matrix

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| Update group (name/desc/visibility) | Yes (`canEdit`) | Yes (`canEdit`) | No |
| Delete group | Yes (`isOwner`) | No | No |
| Add member | Yes (`isOwner`) | No | No |
| Remove member | Yes (`isOwner`) or self | No | Self only |
| Transfer ownership | Yes (`isOwner`) | No | No |
| Add document | Yes (`canEdit`) | Yes (`canEdit`) | No |
| Remove document | Yes (`canEdit`) | Yes (`canEdit`) | No |

---
[Back to Index](../index.md)
