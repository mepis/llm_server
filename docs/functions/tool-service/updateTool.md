tags: [tools, custom-tools]
role: backend-developer

# updateTool(toolId, updates)

Updates a tool document using Mongoose `findByIdAndUpdate` with validators enabled.

**Parameters:** `toolId` — the Tool `_id`, `updates` — object of fields to update (e.g. `{ name: 'newName', description: 'updated' }`).

**Returns:** `{ success: true, data: tool }` — the updated document.

**Throws:** `Error('Tool not found')` if tool does not exist. Validation errors from Mongoose are re-thrown.

---
[Back to Tool Service Functions](./tool-service-functions.md)
