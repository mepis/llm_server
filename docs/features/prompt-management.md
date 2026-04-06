# Prompt Management

This document covers the prompt management system in LLM Server, including prompt template creation, variable support, tags and categories, and prompt execution.

---

## Overview

The prompt management system provides a powerful way to create, manage, and execute prompt templates. Key capabilities include:

- Create, edit, and delete prompt templates
- Support for variables and parameters
- Tag-based organization
- Public/private prompt sharing
- Prompt execution with parameterized inputs
- Usage tracking and statistics

### Prompt Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Prompt Schema                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  user_id     │  ObjectId (references User)                   │
│  │  name        │  String (1-100 chars)                        │
│  │  description │  String (0-500 chars)                        │
│  │  content     │  String (prompt template)                    │
│  │  type        │  String (chat, completion, instruct)         │
│  │  tags        │  String[]                                    │
│  │  is_public   │  Boolean                                      │
│  │  variables   │  Array of variable objects                   │
│  │  usage_count │  Number                                       │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  │  settings    │  Object (prompt settings)                    │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Variable    │  ┌──────────────┐                            │
│  │  []          │  │  name        │  String (variable name)   │
│  │              │  │  description │  String                    │
│  │              │  │  required    │  Boolean                   │
│  │              │  │  type        │  String (default: string) │
│  │              │  │  default     │  String/Number/Object     │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Settings    │  ┌──────────────┐                            │
│  │  []          │  │  temperature │  Number (default: 0.7)    │
│  │              │  │  max_tokens  │  Number (default: 2048)   │
│  │              │  │  top_p       │  Number (default: 0.9)    │
│  │              │  │  frequency   │  Number (default: 0.0)    │
│  │              │  │  presence    │  Number (default: 0.0)    │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prompt Template Types

### Prompt Types

| Type | Description | Use Case |
|------|-------------|----------|
| `chat` | Chat-style prompts | Conversation with LLM |
| `completion` | Text completion | Continue text |
| `instruct` | Instruction following | Follow specific instructions |
| `custom` | Custom format | Specialized use cases |

### Prompt Type Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prompt Type Comparison                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chat Prompt:                                                    │
│  ┌─────────────────────────────────────────────────┐           │
│  │  System: You are a helpful assistant.           │           │
│  │  User: What is RAG?                             │           │
│  │  Assistant: RAG combines...                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Completion Prompt:                                              │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Write a blog post about...                     │           │
│  │  [continuation generated]                       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Instruct Prompt:                                                │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Instructions:                                 │           │
│  │  - List 5 tips for...                          │           │
│  │  - Format as numbered list                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Custom Prompt:                                                   │
│  ┌─────────────────────────────────────────────────┐           │
│  │  [Any format you define]                       │           │
│  │  Variables: [{{variable_name}}]                │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Variable Support

### Variables Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Variable Schema                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  name        │  Variable identifier (e.g., "topic")        │
│  │  description │  Description of variable                 │
│  │  required    │  Whether variable is required              │
│  │  type        │  Variable type (string, number, boolean)    │
│  │  default     │  Default value if not provided              │
│  │  examples    │  Example values (optional)                  │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Variable Substitution

```
┌─────────────────────────────────────────────────────────────────┐
│                    Variable Substitution Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Prompt with │                                               │
│  │  variables   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get        │                                               │
│  │  values     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Replace    │                                               │
│  │  placeholders│                                             │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate   │                                               │
│  │  required   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Execute    │                                               │
│  │  with       │                                               │
│  │  values     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prompt Creation

### Create Prompt

```
POST /api/prompts
```

### Request Body

```json
{
  "name": "Code Review Prompt",
  "description": "Review code for best practices",
  "content": "Review the following code for:\n1. Performance issues\n2. Security vulnerabilities\n3. Best practices",
  "type": "instruct",
  "tags": ["review", "performance", "security"],
  "is_public": false,
  "variables": [
    {
      "name": "code",
      "description": "The code to review",
      "required": true,
      "type": "string"
    }
  ],
  "settings": {
    "temperature": 0.7,
    "max_tokens": 2048,
    "top_p": 0.9
  }
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "name": "Code Review Prompt",
    "type": "instruct",
    "is_public": false,
    "created_at": "2026-04-03T10:50:00Z"
  }
}
```

---

## Prompt Execution

### Execute Prompt

```
POST /api/prompts/execute
```

### Request Body

```json
{
  "prompt_id": "prompt_60d5ec4f1234567890abcdef",
  "variables": {
    "code": "function add(a, b) {\n  return a + b;\n}"
  }
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "output": "Here's a review of the code:\n\n1. **Performance**:\n   - Function is simple and efficient\n   - No obvious performance issues",
    "usage_count": 1,
    "tokens_used": 150,
    "execution_time_ms": 245
  }
}
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prompt Execution Flow                         │
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
│  │  prompt     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Replace    │                                               │
│  │  variables  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  Inference   │                                               │
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
│  │  Return      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tags and Categories

### Tag System

Prompts can be organized using tags for easy filtering and discovery.

| Tag | Description |
|-----|-------------|
| `review` | Code review prompts |
| `performance` | Performance optimization |
| `security` | Security analysis |
| `qa` | Question answering |
| `general` | General purpose |
| `custom` | Custom format |

### Tag Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tag Organization                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Prompt      │                                               │
│  │  Library     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Filter by   │                                               │
│  │  tags        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Display    │                                               │
│  │  filtered   │                                               │
│  │  results    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Prompt Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/prompts` | Create prompt | Yes |
| GET | `/api/prompts` | List prompts | Yes |
| GET | `/api/prompts/:id` | Get prompt | Yes |
| PUT | `/api/prompts/:id` | Update prompt | Yes |
| DELETE | `/api/prompts/:id` | Delete prompt | Yes |
| POST | `/api/prompts/execute` | Execute prompt | Yes |

### Public Prompts

| Endpoint | Description | Auth Required |
|----------|-------------|---------------|
| GET | `/api/prompts/public` | No |

---

## Tags

- `prompts` - Prompt template management
- `user` - Standard user capabilities
- `user-management` - User CRUD operations
- `security` - Security best practices

---

## Related Documentation

- [LLM Integration](./llm-integration.md) - Llama.cpp inference
- [Chat Sessions](./chat-sessions.md) - Using prompts in chat
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Create Prompt Template

```javascript
async function createPromptTemplate(name, content, variables) {
  const db = await getDB();
  
  const prompt = {
    user_id: userId,
    name,
    content,
    type: 'chat',
    tags: ['custom'],
    is_public: false,
    variables: variables.map(v => ({
      name: v.name,
      description: v.description,
      required: v.required,
      type: v.type || 'string'
    })),
    settings: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9
    },
    created_at: new Date()
  };
  
  const result = await db.collection('prompts').insertOne(prompt);
  return result.insertedId;
}
```

### Example 2: Execute Prompt with Variables

```javascript
async function executePrompt(promptId, variables) {
  const db = await getDB();
  
  // Get prompt template
  const prompt = await db.collection('prompts').findOne({
    _id: promptId,
    user_id: userId
  });
  
  // Replace variables
  let processedContent = prompt.content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, value);
  }
  
  // Execute with LLM
  const response = await llamaInference({
    model: prompt.settings.model,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: processedContent }
    ]
  });
  
  // Increment usage count
  await db.collection('prompts').updateOne(
    { _id: promptId },
    { $inc: { usage_count: 1 } }
  );
  
  return response;
}
```

### Example 3: Search Prompts by Tags

```javascript
async function searchPrompts(tags) {
  const db = await getDB();
  
  const query = {
    tags: { $in: tags },
    is_public: true
  };
  
  const prompts = await db.collection('prompts').find(query).toArray();
  
  return prompts;
}
```
