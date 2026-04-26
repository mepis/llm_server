tags: [chat, session, message]
role: backend-developer

# addMessageToSession(sessionId, role, content)

Adds a message to an existing session using the `ChatSession.addMessage()` Mongoose method. Validates that the session exists first.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | Session to add the message to |
| role | String | One of: `'system'`, `'user'`, `'assistant'`, `'tool'` |
| content | String | Message text content |

**Returns:** `{ success: true, data: session }` — the updated session with the new message in `messages` array.

**Throws:** `Error('Session not found')` if sessionId does not exist.

---
[Back to Chat Service Functions](./chat-service-functions.md)
