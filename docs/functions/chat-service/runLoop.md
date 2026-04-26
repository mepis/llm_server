tags: [chat, llm, loop, tools]
role: backend-developer

# runLoop(sessionId, content, options)

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

---
[Back to Chat Service Functions](./chat-service-functions.md)
