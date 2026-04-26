tags: [chat, session]
role: backend-developer

# createChatSession(userId, sessionName, options)

Creates a new chat session in the database.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | ObjectId | required | The user who owns this session |
| sessionName | String | required | Display name for the session |
| options | Object | `{}` | Configuration overrides |

**Options defaults:** `model: 'llama-3-8b'`, `temperature: 0.7`, `maxTokens: 2048`, `enableRAG: false`, `ragDocuments: []`

**Returns:** `{ success: true, data: session }` — the created ChatSession document with `_id`, `session_name`, `metadata`, `rag_enabled`, `rag_document_ids`.

**Example:**

```js
const result = await createChatSession(userId, 'Project Discussion', {
  model: 'llama-3-70b',
  temperature: 0.5,
  maxTokens: 4096,
  enableRAG: true,
  ragDocuments: [docId1, docId2]
});
```

---
[Back to Chat Service Functions](./chat-service-functions.md)
