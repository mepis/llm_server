tags: [chat, internal, openai]
role: backend-developer

# buildMessages(session)

**Internal Function**

Transforms `session.messages` to OpenAI API format. Handles two special cases:

- Messages with `tool_calls`: returns `{ role: 'assistant', content: null, tool_calls: [...] }`
- Tool messages with `tool_call_id`: returns `{ role: 'tool', tool_call_id: "...", content: "..." }`

---
[Back to Chat Service Functions](./chat-service-functions.md)
