# Matrix Integration

This document covers the Matrix integration in LLM Server, enabling the application to interact with the Matrix messaging protocol through webhook handling and bot functionality.

---

## Overview

The Matrix integration allows LLM Server to function as a Matrix bot, receiving messages from Matrix rooms and providing AI-powered responses. Key capabilities include:

- Webhook-based message reception
- Automatic user creation from Matrix IDs
- Room-specific chat sessions
- Message processing and response generation
- Response sending to Matrix

### Matrix Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Matrix Integration Architecture               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  Homeserver  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Webhook     │                                               │
│  │  Handler     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Process     │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create/     │                                               │
│  │  User        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create/     │                                               │
│  │  Chat        │                                               │
│  │  Session     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Send        │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  Homeserver  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Matrix Message Schema

### MatrixMessage Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      MatrixMessage Schema                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  room_id     │  String (Matrix room ID)                     │
│  │  user_id     │  String (Matrix user ID)                     │
│  │  message_id  │  String (unique message ID)                  │
│  │  content     │  String (message content)                    │
│  │  message_type│  String (m.text, m.image, m.file, m.emote)  │
│  │  is_incoming │  Boolean                                      │
│  │  sender_name│  String (display name)                        │
│  │  attachments │  Array of attachment objects                 │
│  │  received_at │  Timestamp                                    │
│  │  processed_at│  Timestamp                                    │
│  │  status      │  String (received, processing, processed)    │
│  │  error       │  String (if processing failed)               │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Metadata    │  ┌──────────────┐                            │
│  │  []          │  │  transaction│  String                      │
│  │              │  │  device_id  │  String                      │
│  │              │  │  user_agent │  String                      │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Message Flow

### Incoming Message Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incoming Message Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  Homeserver  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Webhook     │                                               │
│  │  receives    │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Save to     │                                               │
│  │  database    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check       │                                               │
│  │  user        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  User exists?│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ YES                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create/     │                                               │
│  │  Chat        │                                               │
│  │  Session     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auto-       │                                               │
│  │  create      │                                               │
│  │  user        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Process     │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Send        │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Webhook Configuration

### Webhook Setup

Matrix webhooks are configured on the Matrix homeserver to forward messages to the LLM Server application.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Webhook Configuration                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  Homeserver  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Configure   │                                               │
│  │  webhook     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Webhook     │                                               │
│  │  URL         │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  POST        │                                               │
│  │  /api/       │                                               │
│  │  matrix/     │                                               │
│  │  messages    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Webhook Request Format

```json
{
  "room_id": "!abc123:matrix.org",
  "sender": "@user:matrix.org",
  "content": "What is RAG?",
  "message_type": "m.text",
  "timestamp": "2026-04-03T10:30:00Z",
  "attachments": [],
  "metadata": {
    "transaction_id": "txn_123",
    "device_id": "dev_456"
  }
}
```

---

## Auto User Creation

When a Matrix user sends a message, the system can automatically create a user account in LLM Server.

### Auto-Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auto User Creation Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Matrix      │                                               │
│  │  user        │                                               │
│  │  sends       │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check       │                                               │
│  │  user        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  User exists?│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Extract     │                                               │
│  │  username    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create      │                                               │
│  │  user        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  token       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Continue    │                                               │
│  │  processing  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Session per Room

Each Matrix room can have its own chat session, allowing conversation history to be maintained per room.

### Room Chat Session

```
┌─────────────────────────────────────────────────────────────────┐
│                    Room Chat Session                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Chat        │                                               │
│  │  Session     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  room_id     │  Matrix room ID                              │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  user_id     │  Matrix user ID                              │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  messages    │  Message history                             │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  memory      │  Conversation context                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  rag_enabled │  RAG configuration                           │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Matrix Integration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/matrix/messages` | Handle webhook | No |
| POST | `/api/matrix/send` | Send message | System |
| GET | `/api/matrix/messages` | Get messages | System |
| POST | `/api/matrix/process` | Process message | System |
| GET | `/api/matrix/status` | Get status | System |

---

## Tags

- `matrix` - Matrix integration
- `system` - System-level operations
- `user` - Standard user capabilities

---

## Related Documentation

- [System Monitoring](./system-monitoring.md) - Matrix message logs
- [Chat Sessions](./chat-sessions.md) - Room-specific sessions
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Handle Matrix Webhook

```javascript
async function handleMatrixMessage(req, res) {
  const { room_id, sender, content } = req.body;
  
  // Save to database
  await db.collection('matrixMessages').insertOne({
    room_id,
    user_id: sender,
    content,
    is_incoming: true,
    received_at: new Date()
  });
  
  // Check if user exists
  const user = await db.collection('users').findOne({
    email: sender // Extract from Matrix ID
  });
  
  // Create user if not exists
  if (!user) {
    await createUserFromMatrix(sender);
  }
  
  // Process message
  const response = await processMatrixMessage(room_id, sender, content);
  
  // Send response
  await sendMatrixMessage(room_id, sender, response);
  
  return { success: true };
}
```

### Example 2: Send Response to Matrix

```javascript
async function sendMatrixMessage(room_id, sender, content) {
  const matrixClient = new MatrixClient({
    baseUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN
  });
  
  await matrixClient.sendMessage(room_id, {
    body: content,
    format: 'org.matrix.custom.html',
    html: `<b>LLM Server</b>: ${content}`
  });
}
```

### Example 3: Get Matrix Status

```javascript
async function getMatrixStatus() {
  const status = {
    isConnected: false,
    rooms: [],
    messages: [],
    last_sync: null
  };
  
  try {
    const client = new MatrixClient({
      baseUrl: process.env.MATRIX_HOMESERVER
    });
    
    status.isConnected = true;
    status.rooms = await client.getRooms();
  } catch (error) {
    status.error = error.message;
  }
  
  return status;
}
```

---

## Tags

### Core
- `matrix-integration` - Matrix bot functionality
- `webhooks` - Webhook configuration
- `bot-functionality` - Bot message handling

### Workflow
- `workflows` - Multi-step workflows
- `multi-turn-chat` - Conversation management
- `complete-pipeline` - End-to-end pipeline
- `retry-patterns` - Retry logic and backoff

---

## Related Documentation

- [User Management](./user-management.md) - User CRUD operations
- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [Middleware](../components/middleware.md) - Auth and RBAC middleware

---

## Practical Examples

### Example 1: Handle Matrix Webhook
