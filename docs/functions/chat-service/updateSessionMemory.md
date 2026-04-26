tags: [chat, session, memory]
role: backend-developer

# updateSessionMemory(sessionId, memoryData)

Updates conversation summary, key_points, entities, and preferences in a session's metadata via `ChatSession.updateMemory()`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | String/ObjectId | Session to update |
| memoryData | Object | Fields to merge into `session.memory`: `conversation_summary`, `key_points`, `entities`, `preferences` |

**Returns:** `{ success: true, data: session }`.

---
[Back to Chat Service Functions](./chat-service-functions.md)
