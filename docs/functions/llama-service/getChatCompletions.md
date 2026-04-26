tags: [llama, chat, completion]
role: backend-developer

# getChatCompletions(messages, options)

Base completion endpoint. Posts messages to `POST ${config.llama.url}/v1/chat/completions`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| messages | Array | OpenAI-format message array with `role` and `content` |
| options | Object | LLM options: `temperature`, `max_tokens`, `top_p`, `stream: true/false` |

**Streaming:** When `options.stream: true`, returns an async iterable of SSE chunks. Each chunk follows the OpenAI streaming format: `{ choices: [{ delta: { content: "..." } }] }`.

**Returns (non-streaming):** `{ choices: [{ message: { role, content, tool_calls? } }] }`.

**Returns (streaming):** Async generator yielding parsed SSE event objects.

---
[Back to Llama Service Functions](./llama-service-functions.md)
