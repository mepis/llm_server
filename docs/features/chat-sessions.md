# Chat Sessions

This document covers the chat session management system in LLM Server, including session creation, message handling, streaming responses, and conversation memory.

---

## Overview

The chat session system provides a complete conversation management interface with the following capabilities:

- Create, list, update, and delete chat sessions
- Add messages with role identification (user/assistant/system)
- Streaming responses from LLM
- Conversation memory and context management
- RAG integration for context-aware responses

### Chat Session Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chat Session Schema                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  user_id     │  ObjectId (references User)                   │
│  │  session_name│  String (1-100 chars)                        │
│  │  messages    │  Array of message objects                     │
│  │              │  ┌──────────────┐                            │
│  │              │  │ role         │  user/assistant/system     │
│  │              │  │ content      │  String                     │
│  │              │  │ timestamp    │  Timestamp                 │
│  │              │  │ metadata     │  Object (optional)         │
│  │              │  └──────────────┘                            │
│  │              │  └──────────────┘                            │
│  │  memory      │  Object (conversation context)                │
│  │              │  ┌──────────────┐                            │
│  │              │  │ conversation │                            │
│  │              │  │ summary      │  String                     │
│  │              │  │ key_points   │  String[]                  │
│  │              │  │ entities     │  String[]                  │
│  │              │  │ preferences  │  Object                    │
│  │              │  └──────────────┘                            │
│  │  metadata    │  Object (LLM settings)                       │
│  │              │  ┌──────────────┐                            │
│  │              │  │ model        │  String (default: llama-3-8b) │
│  │              │  │ temperature  │  Number (default: 0.7)     │
│  │              │  │ max_tokens   │  Number (default: 2048)    │
│  │              │  │ top_p        │  Number (default: 0.9)     │
│  │              │  └──────────────┘                            │
│  │  rag_enabled │  Boolean                                      │
│  │  rag_document_ids│  ObjectId[]                              │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Complete Chat Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  User        │                                               │
│  │  sends       │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Frontend    │                                               │
│  │  sends       │                                               │
│  │  POST        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Chat        │                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Save user   │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get RAG     │                                               │
│  │  context     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  Inference   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Stream      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Save        │                                               │
│  │  assistant   │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Session Management

### Create Chat Session

```
POST /api/chats
```

### Request Body

```json
{
  "session_name": "Project Discussion",
  "messages": [],
  "memory": {
    "conversation_summary": "",
    "key_points": [],
    "entities": [],
    "preferences": {}
  }
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "chat_id": "60d5ec4f1234567890abcdef",
    "session_name": "Project Discussion",
    "created_at": "2026-04-03T10:30:00Z"
  }
}
```

### Create Session Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Create Session Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  request     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create      │                                               │
│  │  session     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  session     │                                               │
│  │  data        │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Message Handling

### Add Message

```
POST /api/chats/:id/messages
```

### Request Body

```json
{
  "content": "Explain the RAG functionality",
  "role": "user"
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "message_id": "msg_60d5ec4f1234567890abcdef",
    "role": "assistant",
    "content": "RAG (Retrieval-Augmented Generation) combines...",
    "timestamp": "2026-04-03T10:35:00Z",
    "tokens_used": 150,
    "context_used": [
      {
        "document_id": "doc_abc123",
        "content": "RAG retrieves relevant documents...",
        "score": 0.92
      }
    ]
  }
}
```

### Message Flow with RAG

```
┌─────────────────────────────────────────────────────────────────┐
│              Message Flow with RAG Integration                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  User sends  │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Save user   │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get RAG     │                                               │
│  │  context     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  query       │                                               │
│  │  embedding  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Search      │                                               │
│  │  documents   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get top K   │                                               │
│  │  relevant    │                                               │
│  │  chunks      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Construct   │                                               │
│  │  prompt      │                                               │
│  │  with        │                                               │
│  │  context     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  Inference   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Stream      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Save        │                                               │
│  │  assistant   │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Conversation Memory

The system maintains conversation memory to provide context for ongoing discussions.

### Memory Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Memory Schema                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  conversation│                                               │
│  │  summary     │  Brief summary of the conversation            │
│  │              │                                                │
│  │  ┌──────────┴──────────┐                                    │
│  │  │  key_points         │  Important points from discussion  │
│  │  │  (String[])        │                                     │
│  │  │                    │                                     │
│  │  │  ┌────────────────┴──────────┐                          │
│  │  │  │  entities                │  Named entities           │
│  │  │  │  (String[])             │                            │
│  │  │  │                         │                            │
│  │  │  │  ┌─────────────────────┐ │                          │
│  │  │  │  │  preferences        │ │  User preferences         │
│  │  │  │  │  (Object)           │ │                           │
│  │  │  │  └─────────────────────┘ │                            │
│  │  │  └──────────────────────────┘                             │
│  │  └──────────────┘                                             │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Update Memory

```
PUT /api/chats/:id/memory
```

### Request Body

```json
{
  "conversation_summary": "User asked about RAG and its benefits",
  "key_points": [
    "RAG retrieves relevant documents",
    "Improves response accuracy",
    "Uses semantic search"
  ],
  "entities": ["RAG", "semantic search", "documents"],
  "preferences": {
    "topic": "RAG",
    "difficulty": "beginner"
  }
}
```

### Memory Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Memory Update Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  User        │                                               │
│  │  updates     │                                               │
│  │  memory      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Find        │                                               │
│  │  session     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Update      │                                               │
│  │  memory      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  success     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Chat Session Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chats` | Create new session | Yes |
| GET | `/api/chats` | List sessions | Yes |
| GET | `/api/chats/:id` | Get session details | Yes |
| PUT | `/api/chats/:id` | Update session | Yes |
| DELETE | `/api/chats/:id` | Delete session | Yes |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chats/:id/messages` | Add message | Yes |
| GET | `/api/chats/:id/messages` | Get messages | Yes |
| DELETE | `/api/chats/:id/messages` | Clear messages | Yes |

### LLM Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chats/:id/llm` | Send to LLM | Yes |
| GET | `/api/llama/models` | List models | Yes |

### Example API Usage

```bash
# Create new chat session
curl -X POST "http://localhost:3000/api/chats" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "session_name": "Project Discussion"
  }'

# List chat sessions
curl -X GET "http://localhost:3000/api/chats" \
  -H "Authorization: Bearer token"

# Get session details
curl -X GET "http://localhost:3000/api/chats/60d5ec4f1234567890abcdef" \
  -H "Authorization: Bearer token"

# Add message and get response
curl -X POST "http://localhost:3000/api/chats/60d5ec4f1234567890abcdef/messages" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Explain RAG"
  }'

# Update memory
curl -X PUT "http://localhost:3000/api/chats/60d5ec4f1234567890abcdef/memory" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_summary": "User asked about RAG"
  }'

# Delete session
curl -X DELETE "http://localhost:3000/api/chats/60d5ec4f1234567890abcdef" \
  -H "Authorization: Bearer token"
```

---

## Tags

- `chat` - Chat session management
- `llm` - LLM inference and embeddings
- `rag` - Retrieval-augmented generation
- `streaming` - Real-time streaming responses
- `memory` - Conversation memory management
- `user` - Standard user capabilities

---

## Related Documentation

- [LLM Integration](./llm-integration.md) - Llama.cpp inference
- [RAG System](./rag-system.md) - Document retrieval
- [Chat Sessions](./chat-sessions.md) - Session management
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Create a Chat Session

```javascript
async function createChatSession(name) {
  const db = await getDB();
  
  const session = {
    user_id: userId,
    session_name: name,
    messages: [],
    memory: {
      conversation_summary: '',
      key_points: [],
      entities: [],
      preferences: {}
    },
    metadata: {
      model: 'llama-3-8b',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9
    },
    rag_enabled: true,
    created_at: new Date()
  };
  
  const result = await db.collection('chatSessions').insertOne(session);
  return result.insertedId;
}
```

### Example 2: Add Message with Streaming

```javascript
async function addMessage(chatId, content) {
  const db = await getDB();
  
  // Save user message
  const userMessage = {
    role: 'user',
    content,
    timestamp: new Date()
  };
  
  await db.collection('chatSessions').updateOne(
    { _id: chatId },
    { $push: { messages: userMessage } }
  );
  
  // Generate RAG context
  const context = await getRAGContext(content);
  
  // Stream response
  const response = await streamLLMResponse(context, content);
  
  // Save assistant message
  const assistantMessage = {
    role: 'assistant',
    content: response,
    timestamp: new Date(),
    metadata: {
      tokens_used: response.tokenCount,
      embedding_used: true
    }
  };
  
  await db.collection('chatSessions').updateOne(
    { _id: chatId },
    { $push: { messages: assistantMessage } }
  );
  
  return assistantMessage;
}
```

### Example 3: Update Conversation Memory

```javascript
async function updateMemory(chatId, summary, keyPoints, entities) {
  const db = await getDB();
  
  const memory = {
    conversation_summary: summary,
    key_points: keyPoints,
    entities: entities
  };
  
  await db.collection('chatSessions').updateOne(
    { _id: chatId },
    { $set: { memory } }
  );
  
  return memory;
}
```
