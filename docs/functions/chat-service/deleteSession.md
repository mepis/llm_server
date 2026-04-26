tags: [chat, session]
role: backend-developer

# deleteSession(sessionId)

Deletes a session and all associated ToolCall documents.

**Process:** First deletes all `ToolCall` documents with matching `session_id`, then deletes the `ChatSession`.

**Returns:** `{ success: true }`.

**Throws:** `Error('Session not found')` if session does not exist.

---
[Back to Chat Service Functions](./chat-service-functions.md)
