tags: [tools, registry, mongodb]
role: backend-developer

# loadCustomTools(model)

**Internal Function**

Loads active custom tools from the database and wraps them for use in LLM conversations.

**Process:**
1. Queries `Tool.find({ is_active: true })` sorted by `created_at` descending
2. For each tool, builds a Zod schema from its `parameters` array using `buildZodSchemaFromParameters()`
3. Wraps the tool's JavaScript code into an execute function

**Returns:** Array of tool objects compatible with builtin tools: `{ id, description, parameters (Zod), execute(args, ctx) }`.

---
[Back to Tool Service Functions](./tool-service-functions.md)
