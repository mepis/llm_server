tags: [tools, execution, zod]
role: backend-developer

# callTool(toolId, userRoles, input)

Validates input against the tool's Zod schema and executes the tool code via `AsyncFunction` constructor.

**Execution flow:**

```
  callTool(toolId, userRoles, input)
        │
   ┌────▼──────────┐
   │ Find tool with│
   │ role check    │────→ throw if not found / access denied
   └────┬──────────┘
        │
   ┌────▼──────────┐
   │ Is active?    │────→ throw if disabled
   └────┬──────────┘
        │
   ┌────▼──────────────┐
   │ Build Zod schema  │
   │ from parameters   │
   └────┬──────────────┘
        │
   ┌────▼──────────────┐
   │ Validate input    │────→ throw ZodError with field details
   └────┬──────────────┘
        │
   ┌────▼─────────────────┐
   │ Create AsyncFunction  │
   │ from tool.code        │
   │ Strip wrapper if      │
   │ present (async fn /   │
   │ function)             │
   └────┬─────────────────┘
        │
   ┌────▼──────────┐
   │ Execute with   │
   │ validatedArgs  │
   └────┬──────────┘
        │
   ┌────▼────────────────────┐
   │ Return result as string  │
   │ or JSON.stringify()      │
   └─────────────────────────┘
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| toolId | ObjectId | Tool to execute |
| userRoles | Array | User roles for access control |
| input | Object | Arguments matching the tool's parameter schema |

**Returns:** `{ success: true, data: { tool, input, output } }` where `output` is a string (JSON-serialized if result is an object).

---
[Back to Tool Service Functions](./tool-service-functions.md)
