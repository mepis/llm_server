tags: [tools, registry]
role: backend-developer

# executeCustomTool(tool, args)

**Internal Function**

Executes a custom tool's JavaScript code safely via `AsyncFunction('params', code)`. Handles errors gracefully by returning an error output string instead of throwing.

**Returns:** `{ output: "...", title: tool.name, metadata: { error: true/false } }`.

---
[Back to Tool Service Functions](./tool-service-functions.md)
