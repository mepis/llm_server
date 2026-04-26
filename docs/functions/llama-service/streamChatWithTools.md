tags: [llama, chat, tools, streaming]
role: backend-developer

# streamChatWithTools(messages, tools, options)

Streaming version of `chatWithTools`. Returns an async generator (`async *`) that parses SSE chunks and yields each parsed event.

**SSE parsing logic:**

```
  For each raw chunk from the HTTP stream:
    ┌──────────────────────────────┐
    │ Append to buffer             │
    │ Split by newlines            │
    │ Keep last partial line in    │
    │   buffer for next iteration  │
    └──────────────┬───────────────┘
                   │
    For each complete line:
      Starts with "data: "?
         YES → strip prefix
              Parse as JSON
              Yield parsed object
              If "[DONE]" → return (stop)
         NO  → skip
```

**Yielded event structure:** Each SSE `data:` line is returned as-is from Llama.cpp. For content streaming, events contain `{ choices: [{ delta: { content: "..." } }] }`. For tool call streaming, events contain `{ choices: [{ delta: { tool_calls: [{ index, id, type, function: { name?, arguments? } }] } }] }`.

**Error handling:** Parse failures are logged as warnings (not thrown) to avoid breaking the stream.

---
[Back to Llama Service Functions](./llama-service-functions.md)
