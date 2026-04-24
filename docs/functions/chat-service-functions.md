tags: [chat, assistant, tools, streaming]
role: backend-developer

# Chat Service Functions

Documented from `src/services/chatService.js`. The chat service manages conversation sessions, message flow, tool execution, and multi-turn interactions with the LLM.

## createChatSession(userId, sessionName, options)

Creates a new chat session in the database.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | ObjectId | required | The user who owns this session |
| sessionName | String | required | Display name for the session |
| options | Object | `{}` | Configuration overrides |

**Options defaults:** `model: 'llama-3-8b'`, `temperature: 0.7`, `maxTokens: 2048`, `enableRAG: false`, `ragDocuments: []`

**Returns:** `{ success: true, data: session }` — the created ChatSession document with `_id`, `session_name`, `metadata`, `rag_enabled`, `rag_document_ids`.

**Example:**

```js
const result = await createChatSession(userId, 'Project Discussion', {
  model: 'llama-3-70b',
  temperature: 0.5,
  maxTokens: 4096,
  enableRAG: true,
  ragDocuments: [docId1, docId2]
});
```

## addMessageToSession(sessionId, role, content)

Adds a message to an existing session using the `ChatSession.addMessage()` Mongoose method. Validates that the session exists first.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | Session to add the message to |
| role | String | One of: `'system'`, `'user'`, `'assistant'`, `'tool'` |
| content | String | Message text content |

**Returns:** `{ success: true, data: session }` — the updated session with the new message in `messages` array.

**Throws:** `Error('Session not found')` if sessionId does not exist.

## getMessages(sessionId)

Returns all messages stored in a session.

**Parameters:** `sessionId` — String or ObjectId of the session.

**Returns:** `{ success: true, data: [...] }` — array of message objects with `role`, `content`, `timestamp`, and optional `tool_calls`/`metadata`.

**Throws:** `Error('Session not found')` if sessionId does not exist.

## chatWithLLM(sessionId, content, options)

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

## runLoop(sessionId, content, options)

Multi-turn conversation loop. Iterates LLM calls up to `MAX_TOOL_TURNS` (default 10, configurable via Config document), executes tool calls returned by the LLM, and accumulates results until a final text response is received.

**Parameters:** Same as `chatWithLLM`.

**Flowchart:**

```
                    ┌──────────────────┐
                    │  Start turn loop  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ turn < maxTurns? │
                    └────────┬─────────┘
                        YES  │  NO
              ┌──────────────┘  └──────────────┐
              │                                 │
     ┌────────▼────────┐            ┌──────────▼──────────┐
     │ Call LLM with   │            │ Truncated? Log warn │
     │ tools enabled   │            │ Return finalContent │
     └────────┬────────┘            └─────────────────────┘
              │
     ┌────────▼─────────────┐
     │ Response has         │
     │ tool_calls?          │
     └────────┬─────────────┘
        YES   │    NO
 ┌────────────┘    └──────────────┐
 │                                  │
 │ Save assistant msg with          │ Save final text msg
 │ tool_calls                       │ Return content, break
 │ Execute each tool                │
 │ Add tool results to messages     │
 │ turn++, continue loop            │
 └──────────────────────────────────┘
```

**Post-processing (after loop exits):**

1. If session name is `"New Chat"`, auto-generates a subject from the first user message using `generateSessionSubject()`.
2. Triggers automatic memory extraction via `triggerAutomaticMemoryExtraction()` if message count exceeds threshold (from `MEMORY_EXTRACTION_THRESHOLD` env var, default 10).

**Returns:** `{ success: true, data: finalContent, session }`. If truncated: `data` contains a warning message about exceeding tool turns.

## streamRunLoop(sessionId, content, options)

Async generator (`async *`) version of `runLoop`. Yields streaming events as the LLM generates content and tools execute.

**Event types yielded:**

| Event | Description |
|-------|-------------|
| `{ type: 'turn_start', turn, maxTurns }` | A new tool-use turn begins |
| `{ type: 'chunk', content }` | Content token from LLM SSE stream |
| `{ type: 'tool_call_start', toolCallId, name }` | Tool call detected during stream |
| `{ type: 'tool_call_arg', toolCallId, args }` | Partial arguments for a tool call |
| `{ type: 'tool_result', tool_call_id, content }` | Tool execution result |
| `{ type: 'done', content, truncated, subject }` | All turns complete |
| `{ type: 'error', message }` | Stream error occurred |

**Event sequence diagram:**

```
streamRunLoop() yields events over time:

  ┌───────────────────────────────────────────────────┐
  │ turn_start (turn=0, maxTurns=10)                  │
  │ chunk "The"                                       │
  │ chunk " file"                                     │
  │ chunk " system" ...                               │
  │ tool_call_start id="tc_1", name="bash"            │
  │ tool_call_arg id="tc_1", args='{"command":"ls"}' │
  │ [stream ends for this turn]                       │
  │                                                   │
  │ tool_result tc_1: "file1 file2 ..."               │
  │ turn_start (turn=1, maxTurns=10)                  │
  │ chunk "Here" ...                                  │
  │ [no tool calls]                                   │
  │ [stream ends with stop reason]                    │
  │                                                   │
  │ done { content: "Final answer text",              │
  │       truncated: false,                           │
  │       subject: "File listing" }                   │
  └───────────────────────────────────────────────────┘
```

**Key behavior:** Accumulates tool calls from streaming deltas (parsing partial JSON in function arguments), then batch-execute all accumulated tool calls per turn — matching the non-streaming `runLoop` behavior.

## streamChatResponse(sessionId, messages, options)

Simple streaming: yields content chunks directly from Llama.cpp SSE stream without tool support. Suitable for text-only responses.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | Session to save the response into |
| messages | Array | Message history in OpenAI format |
| options | Object | LLM options (temperature, max_tokens, etc.) |

**Behavior:**

- Uses `AbortController` with a 60-second timeout
- Accumulates chunks into a buffer; flushes when buffer exceeds 100 characters
- Saves the full assembled response to the session after streaming completes

## clearSessionMessages(sessionId)

Clears all messages from a session using `ChatSession.clearMessages()`. Does not delete the session.

**Returns:** `{ success: true, data: session }` — the session with an empty `messages` array.

## updateSessionMemory(sessionId, memoryData)

Updates conversation summary, key_points, entities, and preferences in a session's metadata via `ChatSession.updateMemory()`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | Session to update |
| memoryData | Object | Fields to merge into `session.memory`: `conversation_summary`, `key_points`, `entities`, `preferences` |

**Returns:** `{ success: true, data: session }`.

## getSessionsByUser(userId, options)

Paginated list of a user's chat sessions that have at least one message.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | ObjectId | required | User to list sessions for |
| options | Object | `{}` | Pagination options |

**Options defaults:** `page: 1`, `limit: 10`.

**Returns:** `{ success: true, data: { sessions: [...], total, page, limit, totalPages } }` where each session object contains:

- `chat_id` — session ID as string
- `session_name` — display name
- `message_count` — number of messages
- `last_message` — last assistant message preview (truncated to 50 chars with `"..."`)
- `created_at`, `updated_at` — timestamps

Sessions are sorted by `created_at` descending.

## deleteSession(sessionId)

Deletes a session and all associated ToolCall documents.

**Process:** First deletes all `ToolCall` documents with matching `session_id`, then deletes the `ChatSession`.

**Returns:** `{ success: true }`.

**Throws:** `Error('Session not found')` if session does not exist.

## generateSessionSubject(messages)

Generates a short subject line from the first user message in a session. Used to auto-name sessions that were created as "New Chat".

**Logic:** Takes the first user message (string content, non-empty). If length is 60 characters or fewer, returns it as-is. If longer, truncates at 57 characters and removes the last word, appending `"..."`. Maximum output: 60 characters.

## getToolCalls(sessionId, messageId)

Returns ToolCall documents for a session, optionally filtered by message_id.

**Parameters:** `sessionId` (required), `messageId` (optional).

**Returns:** `{ success: true, data: [...]} — array of ToolCall objects sorted by `created_at` ascending.

## Internal Functions

### buildMessages(session)

Transforms `session.messages` to OpenAI API format. Handles two special cases:

- Messages with `tool_calls`: returns `{ role: 'assistant', content: null, tool_calls: [...] }`
- Tool messages with `tool_call_id`: returns `{ role: 'tool', tool_call_id: "...", content: "..." }`

### resolveTools(session)

Combines builtin tools (bash, read, write, glob, grep, question, todo, skill) and custom tools loaded from the database. Converts to OpenAI function format via `toOpenAITools()`. Returns `{ tools: [...], openAITools: [...] }`.

### executeToolCall(toolCall, session, allTools)

Internal tool execution:

1. Parses tool name, ID, and arguments from the tool_call object
2. Creates a `ToolCall` document with state `'running'`
3. Finds the matching tool from `allTools` by name
4. Builds a context object: `{ sessionID, messageID, agent: 'assistant', abort, messages, metadata, ask }`
5. Executes `tool.execute(input, ctx)`
6. Updates ToolCall document to `'completed'` or `'error'` state
