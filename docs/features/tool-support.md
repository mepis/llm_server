# Tool Support

This document covers the tool support system in LLM Server, inspired by Opencode. It enables creating custom tools, defining parameters, executing tools, and tracking usage.

---

## Overview

The tool support system allows users to create and execute custom tools that can be used by LLMs to perform specific tasks. Key capabilities include:

- Create custom tools with code
- Define tool parameters and types
- Execute tools with validated inputs
- Track tool usage statistics
- Manage active/inactive tools
- Store input/output examples

### Tool Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tool Schema                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  user_id     │  ObjectId (references User)                   │
│  │  name        │  String (unique, 1-100 chars)                │
│  │  description │  String (0-500 chars)                        │
│  │  code        │  String (JavaScript code)                    │
│  │  parameters  │  Array of parameter objects                  │
│  │  is_active   │  Boolean                                      │
│  │  return_type │  String (string, number, boolean, array)     │
│  │  metadata    │  Object (tool metadata)                      │
│  │  usage_count │  Number                                       │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Parameter   │  ┌──────────────┐                            │
│  │  []          │  │  name        │  String                    │
│  │              │  │  type        │  String                    │
│  │              │  │  required    │  Boolean                   │
│  │              │  │  description │  String                    │
│  │              │  │  default     │  String/Number/Object      │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Metadata    │  ┌──────────────┐                            │
│  │  []          │  │  version     │  String (default: 1.0.0)  │
│  │              │  │  author      │  String                    │
│  │              │  │  dependencies│  String[]                  │
│  │              │  │  examples    │  Object[]                  │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Creation

### Create Tool

```
POST /api/tools
```

### Request Body

```json
{
  "name": "File Search",
  "description": "Search for files in the project directory",
  "code": "const fs = require('fs');\n\nfunction searchFiles(pattern) {\n  const files = fs.readdirSync('./');\n  return files.filter(file => file.includes(pattern));\n}",
  "parameters": [
    {
      "name": "pattern",
      "type": "string",
      "required": true,
      "description": "Search pattern (e.g., '*.js')"
    }
  ],
  "is_active": true,
  "return_type": "array"
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "tool_id": "tool_60d5ec4f1234567890abcdef",
    "name": "File Search",
    "description": "Search for files in the project directory",
    "is_active": true,
    "created_at": "2026-04-03T11:00:00Z"
  }
}
```

---

## Tool Parameters

### Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text value | `"hello"` |
| `number` | Numeric value | `42` |
| `boolean` | True/false value | `true` |
| `array` | Array of values | `["a", "b"]` |
| `object` | Object value | `{"key": "value"}` |

### Parameter Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Parameter Schema                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  name        │  Parameter identifier                       │
│  │  type        │  Data type of parameter                     │
│  │  required    │  Whether parameter is required              │
│  │  description │  Description of parameter                   │
│  │  default     │  Default value if not provided              │
│  │  constraints │  Additional constraints (optional)          │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Parameter Examples

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parameter Examples                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  String Parameter:                                               │
│  ┌─────────────────────────────────────────────────┐           │
│  │  name: "filename"                               │           │
│  │  type: "string"                                 │           │
│  │  required: true                                 │           │
│  │  description: "Name of file to read"            │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Number Parameter:                                               │
│  ┌─────────────────────────────────────────────────┐           │
│  │  name: "count"                                   │           │
│  │  type: "number"                                 │           │
│  │  required: true                                 │           │
│  │  description: "Number of items to process"      │           │
│  │  default: 10                                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Boolean Parameter:                                              │
│  ┌─────────────────────────────────────────────────┐           │
│  │  name: "verbose"                                 │           │
│  │  type: "boolean"                                 │           │
│  │  required: false                                 │           │
│  │  description: "Enable verbose output"            │
│  │  default: false                                  │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Array Parameter:                                                │
│  ┌─────────────────────────────────────────────────┐           │
│  │  name: "tags"                                    │           │
│  │  type: "array"                                   │           │
│  │  required: false                                 │           │
│  │  description: "List of tags to filter"           │           │
│  │  constraints: { minItems: 1 }                    │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Execution

### Execute Tool

```
POST /api/tools/:id/execute
```

### Request Body

```json
{
  "pattern": "*.js"
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "result": ["app.js", "config.js", "server.js"],
    "execution_time_ms": 15,
    "usage_count": 1
  }
}
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Execution Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  request     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get        │                                               │
│  │  tool       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Execute    │                                               │
│  │  in sandbox │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate   │                                               │
│  │  output     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Increment  │                                               │
│  │  usage      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return     │                                               │
│  │  result     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Management

### List Tools

```
GET /api/tools
```

### Request Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `active` | boolean | Filter by active status |
| `search` | string | Search by name or description |

### Response (Success)

```json
{
  "success": true,
  "data": [
    {
      "tool_id": "tool_60d5ec4f1234567890abcdef",
      "name": "File Search",
      "description": "Search for files in the project directory",
      "parameters": [
        {
          "name": "pattern",
          "type": "string",
          "required": true
        }
      ],
      "is_active": true,
      "usage_count": 5
    }
  ]
}
```

### Update Tool

```
PUT /api/tools/:id
```

### Delete Tool

```
DELETE /api/tools/:id
```

---

## Sandboxed Execution

### Sandbox Environment

Tools are executed in a sandboxed environment to prevent security issues.

```javascript
// Safe execution context
const sandbox = {
  // Allowed built-in modules
  require: (module) => {
    const allowed = ['fs', 'path', 'os'];
    if (!allowed.includes(module)) {
      throw new Error('Module not allowed');
    }
    return require(module);
  },
  
  // Prevent dangerous operations
  process: undefined,
  console: {
    log: (...args) => {},
    error: (...args) => {},
    warn: (...args) => {}
  },
  
  // Timeout to prevent hanging
  setTimeout: (fn, ms) => {
    setTimeout(() => {
      fn();
      process.exit(1);
    }, ms);
  }
};
```

### Sandbox Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sandbox Security Layers                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Code        │                                               │
│  │  Input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  code        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Execute in  │                                               │
│  │  sandbox     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Timeout     │                                               │
│  │  protection  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  output      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  result      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Tool Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/tools` | Create tool | Yes |
| GET | `/api/tools` | List tools | Yes |
| GET | `/api/tools/:id` | Get tool | Yes |
| PUT | `/api/tools/:id` | Update tool | Yes |
| DELETE | `/api/tools/:id` | Delete tool | Yes |
| POST | `/api/tools/:id/execute` | Execute tool | Yes |

---

## Tags

- `tools` - Custom tool execution
- `user` - Standard user capabilities
- `security` - Security best practices
- `user-management` - User CRUD operations

---

## Related Documentation

- [LLM Integration](./llm-integration.md) - Llama.cpp inference
- [Chat Sessions](./chat-sessions.md) - Using tools in chat
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Create Tool

```javascript
async function createTool(name, code, parameters) {
  const db = await getDB();
  
  const tool = {
    user_id: userId,
    name,
    description: 'Custom tool',
    code,
    parameters: parameters.map(p => ({
      name: p.name,
      type: p.type,
      required: p.required,
      description: p.description
    })),
    is_active: true,
    return_type: 'string',
    metadata: {
      version: '1.0.0',
      author: userId
    },
    created_at: new Date()
  };
  
  const result = await db.collection('tools').insertOne(tool);
  return result.insertedId;
}
```

### Example 2: Execute Tool

```javascript
async function executeTool(toolId, parameters) {
  const db = await getDB();
  
  // Get tool
  const tool = await db.collection('tools').findOne({
    _id: toolId,
    user_id: userId,
    is_active: true
  });
  
  // Create sandbox context
  const sandbox = {
    ...globalContext,
    ...parameters
  };
  
  // Execute tool code
  const result = vm.runInNewContext(tool.code, sandbox);
  
  // Increment usage count
  await db.collection('tools').updateOne(
    { _id: toolId },
    { $inc: { usage_count: 1 } }
  );
  
  return result;
}
```

### Example 3: List Active Tools

```javascript
async function getActiveTools() {
  const db = await getDB();
  
  const tools = await db.collection('tools')
    .find({ user_id: userId, is_active: true })
    .sort({ updated_at: -1 })
    .toArray();
  
  return tools.map(tool => ({
    tool_id: tool._id,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    is_active: tool.is_active,
    usage_count: tool.usage_count
  }));
}
```
