tags: [tools, custom-tools, registry, execution]
role: backend-developer

# Tool Service Functions

Documented from `src/services/toolService.js` and `src/tool/registry.js`. The tool system combines builtin tools (file operations, shell commands) with user-defined custom tools stored in MongoDB.

## toolService.createTool(userId, name, description, parameters, code, isActive, roles)

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

## toolService.getAccessibleTools(userRoles)

Returns all tools whose `roles` array intersects with the user's roles.

**Parameters:** `userRoles` — array of role strings (e.g. `['admin', 'user']`).

**Query:** Finds Tool documents where `roles: { $in: userRoles }`, sorted by `created_at` descending.

**Returns:** `{ success: true, data: [...] }`.

## toolService.getTool(toolId, userRoles)

Retrieves a single tool by ID with role checking.

**Parameters:** `toolId` — the Tool `_id`, `userRoles` — array of user roles.

**Returns:** `{ success: true, data: tool }`.

**Throws:** `Error('Tool not found')` if no matching tool exists or user lacks role access.

## toolService.updateTool(toolId, updates)

Updates a tool document using Mongoose `findByIdAndUpdate` with validators enabled.

**Parameters:** `toolId` — the Tool `_id`, `updates` — object of fields to update (e.g. `{ name: 'newName', description: 'updated' }`).

**Returns:** `{ success: true, data: tool }` — the updated document.

**Throws:** `Error('Tool not found')` if tool does not exist. Validation errors from Mongoose are re-thrown.

## toolService.deleteTool(toolId)

Removes a tool from the database.

**Returns:** `{ success: true }`.

**Throws:** `Error('Tool not found')` if tool does not exist.

## toolService.callTool(toolId, userRoles, input)

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

## Registry Functions (src/tool/registry.js)

### registry.registerBuiltin(tool)

Registers a builtin tool in an internal `Map` keyed by tool ID. Called once at startup via `src/tool/index.js`.

**Registered tools:** `bash`, `read`, `write`, `glob`, `grep`, `question`, `todo`, `skill`.

### registry.getBuiltinTools()

Returns all registered builtin tools as an array. Each tool has: `id`, `description`, `parameters` (Zod schema), `execute` function, and optional `formatValidationError`.

### registry.loadCustomTools(model)

Loads active custom tools from the database and wraps them for use in LLM conversations.

**Process:**
1. Queries `Tool.find({ is_active: true })` sorted by `created_at` descending
2. For each tool, builds a Zod schema from its `parameters` array using `buildZodSchemaFromParameters()`
3. Wraps the tool's JavaScript code into an execute function

**Returns:** Array of tool objects compatible with builtin tools: `{ id, description, parameters (Zod), execute(args, ctx) }`.

### buildZodSchemaFromParameters(parameters)

Converts a parameter array to a Zod object schema. All custom tool parameters are optional by default; required fields get a `.refine()` constraint. Supports types: `'string'`, `'number'`, `'integer'`, `'boolean'`, `'array'` (of strings).

### registry.executeCustomTool(tool, args)

Executes a custom tool's JavaScript code safely via `AsyncFunction('params', code)`. Handles errors gracefully by returning an error output string instead of throwing.

**Returns:** `{ output: "...", title: tool.name, metadata: { error: true/false } }`.

### registry.toOpenAITools(tools)

Converts an array of tool objects to OpenAI function format using `toOpenAITool()` from `src/tool/tool.js`. Each tool becomes:

```json
{
  "type": "function",
  "function": {
    "name": "<tool.id>",
    "description": "<tool.description>",
    "parameters": { "<JSON schema derived from Zod>" }
  }
}
```

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

## Tool Definition Pattern (src/tool/tool.js)

Builtin tools are defined using `defineTool(id, config)` which wraps the execute function with:
1. Zod parameter validation
2. Output truncation (via `truncateOutput()`)

The `toJSONSchema()` function converts Zod schemas to JSON Schema format for OpenAI API compatibility, handling all Zod types including nested objects and arrays.
