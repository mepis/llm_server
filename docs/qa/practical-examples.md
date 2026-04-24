tags: [qa, practical-examples, developer-guide, usage]

# QA - Practical Examples

This document provides practical usage examples for LLM Server features, demonstrating real-world scenarios and implementation patterns.

---

## Multi-turn Chat with Tools

Example conversation where the LLM uses built-in tools to gather information and produce a final answer.

### Scenario: List and read project files

**User:** "What JavaScript files are in the src directory and what does server.js contain?"

**LLM (internal loop):**

```
Turn 1 - LLM decides to use bash tool:
  tool_calls: [{ name: "bash", args: { cmd: "ls src/ | grep .js$" } }]

Worker executes: child_process.spawn("ls", ["src/", "|", "grep", ".js$"])
Result: "server.js\napp.js\nconfig.js"

Turn 2 - LLM reads server.js content:
  tool_calls: [{ name: "read", args: { path: "src/server.js" } }]

Worker executes: fs.readFileSync("src/server.js", "utf-8")
Result: (full file contents)

Turn 3 - LLM produces final answer:
  content: "The src directory contains three JavaScript files:\n\n1. server.js - The main Express application entry point..."
```

### Full curl Example

```bash
# Step 1: Create session
curl -s -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_name": "File Analysis"}' | jq '.data.chat_id'

# Step 2: Send message (non-streaming, waits for full tool loop)
curl -s -X POST http://localhost:3000/api/chat/CHAT_ID/llm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What JavaScript files are in src/ and what does server.js contain?"}'

# Response will contain tool_calls in Turn 1-2, then final content in Turn 3
```

### Vue 3 Component Example (handling tool calls)

```vue
<template>
  <div class="message">
    <div v-if="message.tool_calls" class="tool-calls">
      <div v-for="call in message.tool_calls" :key="call.id" class="tool-call">
        <span class="tool-name">{{ call.function.name }}</span>
        <pre>{{ JSON.stringify(call.function.arguments, null, 2) }}</pre>
      </div>
    </div>
    <div v-if="message.content" class="content">
      {{ message.content }}
    </div>
  </div>
</template>

<script setup>
// Pinia store handles tool call state during streaming
import { useChatStore } from '@/stores/chat'
const chatStore = useChatStore()
</script>
```

---

## RAG-Powered Q&A

Example workflow: upload a document, process it, then ask questions that retrieve relevant context.

### Step-by-Step curl Example

```bash
# Step 1: Upload a PDF document
curl -s -X POST http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./docs/architecture-deep-dive.pdf"

# Response: { success: true, data: { document_id: "doc_abc123", status: "processing" } }

# Step 2: Wait for processing (poll status)
sleep 5

# Check status
curl -s http://localhost:3000/api/rag/documents/doc_abc123 \
  -H "Authorization: Bearer $TOKEN"

# Response should show: status: "processed", chunk_count: N

# Step 3: Ask a question that triggers RAG search
curl -s -X POST http://localhost:3000/api/chat/CHAT_ID/llm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What are the worker thread configurations?"}'

# The LLM will automatically search RAG documents and include relevant chunks
# in the system prompt before sending to Llama.cpp. Response will reference
# the document content.
```

### Frontend Example: Upload and Query

```javascript
// frontend/src/components/RAGUpload.vue (conceptual)
import { ref } from 'vue'
import apiClient from '@/axios'

const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/rag/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  return response.data.data.document_id
}

const ragQuery = async (chatId, query) => {
  const response = await apiClient.post(`/chat/${chatId}/llm`, { content: query })
  // RAG context is automatically injected by chatService
  return response.data.data.content
}
```

---

## Streaming Chat Response

Vue 3 + Pinia example for handling SSE streaming events from the chat endpoint.

### Pinia Store for Streaming

```javascript
// frontend/src/stores/chat.js (streaming section)
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    isStreaming: false,
    currentResponse: '',
    messages: []
  }),

  actions: {
    async sendStreamingMessage(chatId, content) {
      this.isStreaming = true
      this.currentResponse = ''

      const response = await fetch(`/api/chat/${chatId}/llm/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = JSON.parse(line.slice(6))

            switch (eventData.type) {
              case 'content':
                this.currentResponse += eventData.text
                break
              case 'tool_call_start':
                // UI shows tool execution indicator
                break
              case 'tool_result':
                // UI shows tool output
                break
              case 'done':
                // Append final message to chat
                this.messages.push({
                  role: 'assistant',
                  content: this.currentResponse,
                  timestamp: new Date()
                })
                this.isStreaming = false
                this.currentResponse = ''
                break
            }
          }
        }
      }
    }
  }
})
```

### SSE Event Types

| Event Type | Data Format | Frontend Action |
|-----------|-------------|-----------------|
| `content` | `{ type: "content", text: "..." }` | Append to display buffer |
| `tool_call_start` | `{ type: "tool_call_start", name: "...", args: "..." }` | Show tool indicator |
| `tool_call_arg` | `{ type: "tool_call_arg", arg: "..." }` | Fill tool arguments |
| `tool_result` | `{ type: "tool_result", result: "..." }` | Show tool output |
| `done` | `{ type: "done" }` | Finalize message, enable send |

---

## Custom Tool Creation

Step-by-step guide to creating a custom tool that the LLM can invoke during conversations.

### Step 1: Define Parameters (Zod schema)

Parameters define what inputs the tool expects. They are validated using Zod before execution.

```bash
curl -s -X POST http://localhost:3000/api/tools \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Lookup",
    "description": "Fetches current weather for a given city",
    "code": "async function getWeather(city) {\n  const res = await fetch(`https://api.weather.com/${city}`);\n  const data = await res.json();\n  return `${data.temp}°F, ${data.condition}`;\n}",
    "parameters": [
      {
        "name": "city",
        "type": "string",
        "required": true,
        "description": "City name for weather lookup"
      }
    ],
    "is_active": true,
    "return_type": "string"
  }'
```

### Step 2: Execute via POST /api/tools/:id/call

**Critical:** Use `/call` endpoint, not `/execute`.

```bash
# Direct tool execution
curl -s -X POST http://localhost:3000/api/tools/TOOL_ID/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"city": "San Francisco"}'

# Response: { success: true, data: { result: "72°F, Partly Cloudy", usage_count: 1 } }
```

### Step 3: LLM Invokes Tool Automatically

When a user asks a weather question in a chat session, the LLM automatically decides to use the tool:

```
User: "What's the weather in Tokyo?"

LLM internal flow:
  1. Identifies need for external data
  2. Selects "Weather Lookup" tool from available tools
  3. Calls: POST /api/tools/TOOL_ID/call with { city: "Tokyo" }
  4. Receives result
  5. Generates final response using the weather data
```

### Step 4: Validation Error Example

```bash
# Missing required parameter
curl -s -X POST http://localhost:3000/api/tools/TOOL_ID/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response: { success: false, error: "Validation error: missing required parameter 'city'" }
```

---

## Memory-Enhanced Conversations

How memories are automatically extracted and injected into subsequent conversations.

### Automatic Extraction Flow

```
Conversation reaches threshold (default: 10 messages)
    │
    ▼
Filter to user/assistant messages only (exclude system, RAG, tool msgs)
    │
    ▼
Extract three memory layers:
    │
    ├── Episodic: "Discussed deployment strategy for Node.js backend"
    │   └── TTL: 30 days, auto-extended on access
    │
    ├── Semantic: "System uses MongoDB with Mongoose ODM"
    │   └── Indefinite storage, deduplication by keyword overlap
    │
    └── Procedural: "prefers concise answers with markdown formatting"
        └── Indefinite storage, no expiration
    │
    ▼
Apply PII redaction before storage:
    Emails → [EMAIL_REDACTED]
    Phone numbers → [PHONE_REDACTED]
    API keys → [API_KEY_REDACTED]
```

### Memory Injection into System Prompt

When the user starts a new conversation, the system prompt includes:

```
<user_preferences>
- User prefers concise answers with markdown formatting
- Always use code blocks for technical examples
</user_preferences>

<known_facts>
- System uses MongoDB with Mongoose ODM
- Frontend runs Vue 3 on port 5173
</known_facts>

<recent_topics>
- Deployment strategy discussion (2 days ago)
- RAG architecture review (5 days ago)
</recent_topics>
```

### Manual Extraction API Call

```bash
curl -s -X POST http://localhost:3000/api/memory/extract \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "CHAT_ID"}'

# Response shows what was extracted per layer
```

---

## Document Group Collaboration

Create a group, add members with different permissions, and share documents.

### Create Document Group (admin)

```bash
curl -s -X POST http://localhost:3000/api/document-groups \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Team",
    "description": "Shared RAG documents for engineering team",
    "members": [
      { "user_id": "USER_1_ID", "permission": "read" },
      { "user_id": "USER_2_ID", "permission": "write" }
    ]
  }'

# Response: { success: true, data: { document_group_id: "dg_abc123", ... } }
```

### Upload Document to Group

```bash
curl -s -X POST http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer USER_2_TOKEN" \
  -F "file=@./engineering-spec.pdf" \
  -F "document_group_id=dg_abc123"

# Document is shared with all group members based on their permissions
```

### Search Shared Documents

```bash
# Members can search across all documents in their groups
curl -s -X POST http://localhost:3000/api/rag/search \
  -H "Authorization: Bearer USER_1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API rate limiting configuration",
    "top_k": 5,
    "min_score": 0.7
  }'

# Results include documents from the user's own collection
# AND documents from all groups they belong to
```

---

## Skills Integration

How SKILL.md files are discovered and injected into chat system prompts.

### Skill File Structure

Skills live in a `skills/` directory with a `SKILL.md` file:

```
skills/
├── code-review/
│   └── SKILL.md
├── debugging/
│   └── SKILL.md
└── deployment/
    └── SKILL.md
```

### Example SKILL.md

```markdown
---
name: Code Review
version: 1.0.0
---

# Code Review Skill

When the user asks for code review, follow these steps:

1. Check for performance issues (N+1 queries, unnecessary loops)
2. Identify security vulnerabilities (XSS, injection, auth bypass)
3. Verify error handling is comprehensive
4. Suggest improvements following best practices
5. Provide specific line-by-line feedback when applicable
```

### How Skills Are Injected

```
chatService.runLoop() receives a message
    │
    ▼
Load all active skills from skills/ directory
    │
    ▼
Parse each SKILL.md with gray-matter (extract frontmatter + content)
    │
    ▼
Build system prompt:
    <user_preferences> ... </user_preferences>
    <known_facts> ... </known_facts>
    <recent_topics> ... </recent_topics>
    <rag_context> ... </rag_context>
    <skills>
      ## Code Review Skill
      When the user asks for code review, follow these steps:
      1. Check for performance issues...
      2. Identify security vulnerabilities...
    </skills>
    Default instructions
    │
    ▼
Send to Llama.cpp with full system prompt
```

### API: List Available Skills

```bash
curl -s http://localhost:3000/api/skills \
  -H "Authorization: Bearer $TOKEN"

# Response: { success: true, data: [{ name: "Code Review", version: "1.0.0", ... }] }
```

---

## Tags

- `qa` - Quality assurance
- `examples` - Practical examples
- `chat-tools` - Multi-turn tool usage
- `rag` - RAG-powered Q&A
- `streaming` - SSE streaming implementation
- `custom-tools` - Tool creation and execution
- `memory` - Memory system in action
- `collaboration` - Document group features
- `skills` - Skills integration

---

## Related Documentation

- [API Testing Examples](./api-testing-examples.md) - API test cases with curl examples
- [Multi-turn Chat](../features/chat-sessions.md) - Chat session features and tool loops
- [RAG System](../features/rag-system.md) - RAG architecture and usage
- [Tool Support](../features/tool-support.md) - Tool creation and execution reference
- [Persistent Memory](../features/persistent-memory.md) - Memory system details
- [Document Groups](../features/document-groups.md) - Collaboration features
- [API Endpoints](../api/api-endpoints.md) - Complete API reference
