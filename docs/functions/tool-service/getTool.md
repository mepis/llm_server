tags: [tools, custom-tools]
role: backend-developer

# getTool(toolId, userRoles)

Retrieves a single tool by ID with role checking.

**Parameters:** `toolId` — the Tool `_id`, `userRoles` — array of user roles.

**Returns:** `{ success: true, data: tool }`.

**Throws:** `Error('Tool not found')` if no matching tool exists or user lacks role access.

---
[Back to Tool Service Functions](./tool-service-functions.md)
