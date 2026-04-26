tags: [chat, llm, loop, streaming, tools]
role: backend-developer

# streamRunLoop(sessionId, content, options)

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
  │ [stream ends with stop reason]                   │
  │                                                   │
  │ done { content: "Final answer text",              │
  │       truncated: false,                           │
  │       subject: "File listing" }                   │
  └───────────────────────────────────────────────────┘
```

**Key behavior:** Accumulates tool calls from streaming deltas (parsing partial JSON in function arguments), then batch-execute all accumulated tool calls per turn — matching the non-streaming `runLoop` behavior.

---
[Back to Chat Service Functions](./chat-service-functions.md)
