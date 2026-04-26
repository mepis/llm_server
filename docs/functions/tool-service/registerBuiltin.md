tags: [tools, registry]
role: backend-developer

# registerBuiltin(tool)

**Internal Function**

Registers a builtin tool in an internal `Map` keyed by tool ID. Called once at startup via `src/tool/index.js`.

**Registered tools:** `bash`, `read`, `write`, `glob`, `grep`, `question`, `todo`, `skill`.

---
[Back to Tool Service Functions](./tool-service-functions.md)
