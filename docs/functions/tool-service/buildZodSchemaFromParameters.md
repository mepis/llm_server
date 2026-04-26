tags: [tools, registry, zod]
role: backend-developer

# buildZodSchemaFromParameters(parameters)

**Internal Function**

Converts a parameter array to a Zod object schema. All custom tool parameters are optional by default; required fields get a `.refine()` constraint. Supports types: `'string'`, `'number'`, `'integer'`, `'boolean'`, `'array'` (of strings).

---
[Back to Tool Service Functions](./tool-service-functions.md)
