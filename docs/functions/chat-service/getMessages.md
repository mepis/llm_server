tags: [chat, session, message]
role: backend-developer

# getMessages(sessionId)

Returns all messages stored in a session.

**Parameters:** `sessionId` — String or ObjectId of the session.

**Returns:** `{ success: true, data: [...] }` — array of message objects with `role`, `content`, `timestamp`, and optional `tool_calls`/`metadata`.

**Throws:** `Error('Session not found')` if sessionId does not exist.

---
[Back to Chat Service Functions](./chat-service-functions.md)
