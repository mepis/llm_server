tags: [chat, llm, streaming]
role: backend-developer

# streamChatResponse(sessionId, messages, options)

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

---
[Back to Chat Service Functions](./chat-service-functions.md)
