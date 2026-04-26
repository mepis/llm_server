tags: [llama, chat, tools]
role: backend-developer

# chatWithTools(messages, tools, options)

Chat completion with OpenAI-format tool definitions. Posts to the same `/v1/chat/completions` endpoint but includes a `tools` array in the request body.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| messages | Array | Message history including system prompt |
| tools | Array | OpenAI-format tool definitions (`{ type: 'function', function: { name, description, parameters } }`) |
| options | Object | `temperature`, `max_tokens`, `top_p` |

**Returns:** `{ choices: [{ message: { role: 'assistant', content?, tool_calls? } }] }`. The response may contain either text content or tool_calls (or both).

---
[Back to Llama Service Functions](./llama-service-functions.md)
