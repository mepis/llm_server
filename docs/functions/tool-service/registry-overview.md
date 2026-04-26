tags: [tools, registry]
role: backend-developer

# Tool Registry Overview

The tool system combines builtin tools (file operations, shell commands) with user-defined custom tools stored in MongoDB.

## Builtin vs Custom Tool Registry

```
  ┌──────────────────────────────────────────────┐
  │              Tool Registry                    │
  └──────────────────────────────────────────────┘

  ┌─────────────────────┐    ┌─────────────────────┐
  │   Builtin Tools      │    │   Custom Tools       │
  │   (in-memory Map)    │    │   (MongoDB DB)       │
  ├─────────────────────┤    ├─────────────────────┤
  │ bash                 │    │ user-defined tools   │
  │ read                 │    │ stored as JS code    │
  │ write                │    │ validated by Zod     │
  │ glob                 │    │ role-controlled      │
  │ grep                 │    │                      │
  │ question             │    │                      │
  │ todo                 │    │                      │
  │ skill                │    │                      │
  └─────────┬───────────┘    └─────────┬───────────┘
            │                          │
            │      resolveTools()      │
            │  builtin + custom        │
            ▼                          ▼
         Combined tool array     toOpenAITools()
         for LLM execution       → OpenAI format
```

## Tool Definition Pattern

Builtin tools are defined using `defineTool(id, config)` which wraps the execute function with:
1. Zod parameter validation
2. Output truncation (via `truncateOutput()`)

The `toJSONSchema()` function converts Zod schemas to JSON Schema format for OpenAI API compatibility, handling all Zod types including nested objects and arrays.

---
[Back to Tool Service Functions](./tool-service-functions.md)
