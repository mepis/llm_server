tags: [chat, tool, session]
role: backend-developer

# getToolCalls(sessionId, messageId)

Returns ToolCall documents for a session, optionally filtered by message_id.

**Parameters:** `sessionId` (required), `messageId` (optional).

**Returns:** `{ success: true, data: [...]} — array of ToolCall objects sorted by `created_at` ascending.

---
[Back to Chat Service Functions](./chat-service-functions.md)
