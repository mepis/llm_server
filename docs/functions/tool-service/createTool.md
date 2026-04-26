tags: [tools, custom-tools]
role: backend-developer

# createTool(userId, name, description, parameters, code, isActive, roles)

Creates a custom tool in the database.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | ObjectId | Owner of the tool |
| name | String | Unique tool name (used as tool ID) |
| description | String | Human-readable description for the LLM |
| parameters | Array | Parameter schema: `[{ name, type, required, description }]` |
| code | String | JavaScript function body to execute |
| isActive | Boolean | Whether the tool is available for use |
| roles | Array | Role array controlling access (e.g. `['admin']`) |

**Parameter types:** `'string'`, `'number'`, `'boolean'`. Each parameter has `name`, `type`, `required` (boolean), and `description`.

**Returns:** `{ success: true, data: tool }` — the created Tool document.

---
[Back to Tool Service Functions](./tool-service-functions.md)
