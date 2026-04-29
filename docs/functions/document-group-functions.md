tags: [documents, groups, rbac]
role: backend-developer

# Document Group Functions

Documented from `src/backend/services/documentGroupService.js`. The document group service manages shared collections of RAG documents with RBAC role-based visibility. Groups use a `roles JSON` column with `JSON_OVERLAPS()` for access control, matching the tools table pattern.

## Functions

- [createGroup](./document-group/createGroup.md) - Creates a new DocumentGroup.
- [updateGroup](./document-group/updateGroup.md) - Edits group properties.
- [deleteGroup](./document-group/deleteGroup.md) - Removes a document group.
- [transferOwnership](./document-group/transferOwnership.md) - Transfers group ownership.
- [addDocumentToGroup](./document-group/addDocumentToGroup.md) - Adds a document to a group.
- [removeDocumentFromGroup](./document-group/removeDocumentFromGroup.md) - Removes a document from a group.
- [getGroupAccessibleDocuments](./document-group/getGroupAccessibleDocuments.md) - Gets all accessible documents (personal + group).
- [getGroupDocuments](./document-group/getGroupDocuments.md) - Gets full document objects for a group.

## Concept Overviews

- [Schema and Permissions](./document-group/schema-and-permissions.md) - DocumentGroup schema and permission matrix.

---
[Back to Index](../index.md)
