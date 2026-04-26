tags: [chat, llm, assistant, tools]
role: backend-developer

# chatWithLLM(sessionId, content, options)

Single-turn chat interaction: adds a user message, builds the system prompt with RAG context and skills, calls `llamaService.chatWithTools()`, and returns the assistant response or tool calls.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | The chat session ID |
| content | String | User message text |
| options | Object | Overrides for temperature, max_tokens, top_p, userRoles |

**Flow:**

```
┌─────────────────────────────────────────────────────┐
│  chatWithLLM(sessionId, content)                    │
├─────────────────────────────────────────────────────┤
│  1. Load session from DB                            │
│  2. Add user message to session                     │
│  3. Build messages array (OpenAI format)            │
│  4. Resolve tools (builtin + custom → OpenAI fmt)   │
│  5. Search RAG docs for context (if enabled)        │
│  6. Build skills prompt from available skills       │
│  7. Assemble system message:                        │
│     skills_prompt + rag_context + "helpful assistant"│
│  8. Call llamaService.chatWithTools()               │
│                                                     │
│  ┌─ Response has tool_calls? ─── YES ─────────────┐ │
│  │ Save assistant msg with tool_calls              │ │
│  │ Execute each tool via executeToolCall()         │ │
│  │ Return { content: null, tool_calls, tool_results }│ │
│  │ → needsMoreTurns: true                          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Response has NO tool_calls? ─ YES ────────────┐ │
│  │ Save assistant message with content             │ │
│  │ Return { content: text, needsMoreTurns: false } │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Returns:**
- On tool calls: `{ success: true, data: { content: null, tool_calls: [...], tool_results: [...] }, session, needsMoreTurns: true }`
- On text response: `{ success: true, data: "text...", session, needsMoreTurns: false }`

Citations from RAG are included in the assistant message metadata (source_id, filename, chunk_index, similarity).

---
[Back to Chat Service Functions](./chat-service-functions.md)
