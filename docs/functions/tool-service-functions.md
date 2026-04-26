tags: [tools, custom-tools, registry, execution]
role: backend-developer

# Tool Service Functions

Documented from `src/services/toolService.js` and `src/tool/registry.js`. The tool system combines builtin tools (file operations, shell commands) with user-defined custom tools stored in MongoDB.

## Tool Service Functions

- [createTool](./tool-service/createTool.md) - Creates a custom tool in the database.
- [getAccessibleTools](./tool-service/getAccessibleTools.md) - Returns tools matching user roles.
- [getTool](./tool-service/getTool.md) - Retrieves a single tool by ID.
- [updateTool](./tool-service/updateTool.md) - Updates a tool document.
- [deleteTool](./tool-service/deleteTool.md) - Removes a tool from the database.
- [callTool](./tool-service/callTool.md) - Validates input and executes a tool.

## Registry Functions

- [registerBuiltin](./tool-service/registerBuiltin.md) - Registers a builtin tool.
- [getBuiltinTools](./tool-service/getBuiltinTools.md) - Returns all registered builtin tools.
- [loadCustomTools](./tool-service/loadCustomTools.md) - Loads active custom tools from DB.
- [buildZodSchemaFromParameters](./tool-service/buildZodSchemaFromParameters.md) - Converts parameters to Zod schema.
- [executeCustomTool](./tool-service/executeCustomTool.md) - Executes a custom tool's JS code.
- [toOpenAITools](./tool-service/toOpenAITools.md) - Converts tools to OpenAI format.

## Concept Overviews

- [Tool Registry Overview](./tool-service/registry-overview.md) - Comparison of Builtin vs Custom tools.

---
[Back to Index](../index.md)
