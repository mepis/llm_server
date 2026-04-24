tags: [qa, api-testing, curl-examples, backend]

# QA - API Testing Examples

This document provides practical API testing examples for the LLM Server, organized by feature area. Each example includes HTTP method, URL, headers, request body, and expected response format.

---

## Authentication Tests

### Test 1: User Registration

Create a new user account. Rate limited to 3 registrations per day.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["user"]
  }
}
```

**Error Cases:**

| Condition | Status | Response |
|-----------|--------|----------|
| Missing fields | 400 | `{ success: false, error: "Validation failed" }` |
| Weak password (<12 chars) | 400 | `{ success: false, error: "Password too weak" }` |
| Duplicate username | 409 | `{ success: false, error: "Username already exists" }` |
| Duplicate email | 409 | `{ success: false, error: "Email already exists" }` |
| Rate limit exceeded | 429 | `{ success: false, error: "Too many registrations" }` |

### Test 2: Login

Authenticate and receive a JWT token. Rate limited to 5 requests per 15 minutes.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGQ1ZWM0ZjEyMzQ1Njc4OTBhYmNkZWYiLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTcxMDAwMDAwMCwiZXhwIjoxNzEwMDg2NDAwfQ.abc123",
    "user": {
      "user_id": "60d5ec4f1234567890abcdef",
      "username": "johndoe",
      "email": "john@example.com",
      "roles": ["user"]
    }
  }
}
```

**Note:** Store the token for subsequent requests. The user object includes `roles` as an array.

### Test 3: Login with Wrong Password

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "WrongPassword!"
  }'
```

**Expected Response (401):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Test 4: Get Current User Profile

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["user"],
    "is_active": true,
    "preferences": {
      "theme": "light",
      "default_model": "llama-3-8b",
      "language": "en"
    },
    "created_at": "2026-04-03T10:30:00.000Z"
  }
}
```

### Test 5: Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true
}
```

---

## Chat Session Tests

### Test 6: Create Chat Session

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "session_name": "API Testing Session"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "chat_id": "67a1b2c3d4e5f6a7b8c9d0e1",
    "session_name": "API Testing Session",
    "user_id": "60d5ec4f1234567890abcdef",
    "created_at": "2026-04-03T11:00:00.000Z",
    "messages": [],
    "memory": {
      "conversation_summary": "",
      "key_points": [],
      "entities": [],
      "preferences": {}
    }
  }
}
```

### Test 7: List Chat Sessions

```bash
curl -X GET http://localhost:3000/api/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "chat_id": "67a1b2c3d4e5f6a7b8c9d0e1",
      "session_name": "API Testing Session",
      "subject": "",
      "message_count": 0,
      "updated_at": "2026-04-03T11:00:00.000Z"
    }
  ]
}
```

### Test 8: Get Chat Session (with `/:sessionId` alias)

Both `/:id` and `/:sessionId` path params work:

```bash
curl -X GET http://localhost:3000/api/chat/67a1b2c3d4e5f6a7b8c9d0e1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "chat_id": "67a1b2c3d4e5f6a7b8c9d0e1",
    "session_name": "API Testing Session",
    "user_id": "60d5ec4f1234567890abcdef",
    "created_at": "2026-04-03T11:00:00.000Z",
    "messages": [
      {
        "_id": "msg_abc123",
        "role": "user",
        "content": "Hello",
        "timestamp": "2026-04-03T11:05:00.000Z"
      },
      {
        "_id": "msg_def456",
        "role": "assistant",
        "content": "Hi! How can I help you today?",
        "timestamp": "2026-04-03T11:05:03.000Z"
      }
    ],
    "memory": {
      "conversation_summary": "",
      "key_points": [],
      "entities": [],
      "preferences": {}
    }
  }
}
```

### Test 9: Send Message (non-streaming)

```bash
curl -X POST http://localhost:3000/api/chat/67a1b2c3d4e5f6a7b8c9d0e1/llm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What files are in the src directory?"
  }'
```

**Expected Response with tool calls (200):**

```json
{
  "success": true,
  "data": {
    "content": null,
    "tool_calls": [
      {
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "bash",
          "arguments": "{\"cmd\": \"ls src/\"}"
        }
      }
    ],
    "tokens_used": 45,
    "model": "llama-3-8b"
  }
}
```

**Expected Response with plain content (200):**

```json
{
  "success": true,
  "data": {
    "content": "The src directory contains several subdirectories including controllers, models, routes, and services.",
    "tool_calls": null,
    "tokens_used": 52,
    "model": "llama-3-8b"
  }
}
```

### Test 10: Streaming Chat Response

SSE streaming returns incremental chunks as they are generated.

```bash
curl -X POST http://localhost:3000/api/chat/67a1b2c3d4e5f6a7b8c9d0e1/llm/stream \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Explain how RAG works"
  }' \
  -N
```

**Expected SSE Output:**

```
event: chunk
data: {"type":"content","text":""}

event: chunk
data: {"type":"content","text":"RAG (Retrieval"}

event: chunk
data: {"type":"content","text":"-Augmented"}

event: chunk
data: {"type":"content","text":" Generation)"}

event: done
data: {"type":"done"}
```

### Test 11: Delete Chat Session

```bash
curl -X DELETE http://localhost:3000/api/chat/67a1b2c3d4e5f6a7b8c9d0e1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true
}
```

---

## RAG System Tests

### Test 12: Upload Document

Supported formats: PDF, DOCX, XLSX. Uses `multer` for file upload.

```bash
curl -X POST http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@/path/to/document.pdf"
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
    "filename": "document.pdf",
    "file_type": "application/pdf",
    "status": "processing",
    "chunk_count": 0,
    "uploaded_at": "2026-04-03T12:00:00.000Z"
  }
}
```

### Test 13: List Documents

```bash
curl -X GET http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
      "filename": "document.pdf",
      "file_type": "application/pdf",
      "status": "processed",
      "chunk_count": 45,
      "uploaded_at": "2026-04-03T12:00:00.000Z"
    }
  ]
}
```

### Test 14: Get Document Chunks

```bash
curl -X GET http://localhost:3000/api/rag/documents/doc_67a1b2c3d4e5f6a7b8c9d0e2/chunks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "chunk_001",
      "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
      "chunk_index": 0,
      "text": "RAG combines retrieval of relevant documents with language model generation...",
      "tokens": 120,
      "embedding": [0.023, -0.156, 0.891, ...]
    },
    {
      "_id": "chunk_002",
      "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
      "chunk_index": 1,
      "text": "The retrieval step uses semantic search to find the most relevant chunks...",
      "tokens": 95,
      "embedding": [0.011, -0.234, 0.778, ...]
    }
  ]
}
```

### Test 15: Search Documents

```bash
curl -X POST http://localhost:3000/api/rag/search \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication patterns",
    "top_k": 5,
    "min_score": 0.7
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
      "chunk_index": 12,
      "text": "JWT tokens provide stateless authentication by encoding user claims...",
      "score": 0.92,
      "tokens": 45
    },
    {
      "document_id": "doc_67a1b2c3d4e5f6a7b8c9d0e2",
      "chunk_index": 15,
      "text": "The authMiddleware extracts and verifies JWT tokens from the Authorization header...",
      "score": 0.87,
      "tokens": 38
    }
  ]
}
```

### Test 16: Delete Document

```bash
curl -X DELETE http://localhost:3000/api/rag/documents/doc_67a1b2c3d4e5f6a7b8c9d0e2 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true
}
```

---

## Tool Tests

### Test 17: Create Custom Tool (requires admin)

```bash
curl -X POST http://localhost:3000/api/tools \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Uptime",
    "description": "Returns system uptime in seconds",
    "code": "function getUptime() {\n  return Math.floor(process.uptime());\n}",
    "parameters": [],
    "is_active": true,
    "return_type": "number"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "tool_id": "tool_67a1b2c3d4e5f6a7b8c9d0e3",
    "name": "System Uptime",
    "description": "Returns system uptime in seconds",
    "is_active": true,
    "usage_count": 0,
    "created_at": "2026-04-03T13:00:00.000Z"
  }
}
```

### Test 18: Execute Tool via POST /api/tools/:id/call

**Critical:** The tool execution endpoint is `POST /api/tools/:id/call`, not `/execute`.

```bash
curl -X POST http://localhost:3000/api/tools/tool_67a1b2c3d4e5f6a7b8c9d0e3/call \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "result": 86453,
    "execution_time_ms": 2,
    "usage_count": 1
  }
}
```

### Test 19: Tool with Parameters via /call

```bash
curl -X POST http://localhost:3000/api/tools/tool_67a1b2c3d4e5f6a7b8c9d0e3/call \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "*.js"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "result": ["server.js", "app.js", "config.js"],
    "execution_time_ms": 15,
    "usage_count": 2
  }
}
```

### Test 20: Zod Validation Error (missing required parameter)

```bash
curl -X POST http://localhost:3000/api/tools/tool_67a1b2c3d4e5f6a7b8c9d0e3/call \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wrong_field": "test"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "error": "Validation error: missing required parameter 'pattern'"
}
```

### Test 21: List Tools

```bash
curl -X GET http://localhost:3000/api/tools \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "tool_id": "tool_67a1b2c3d4e5f6a7b8c9d0e3",
      "name": "System Uptime",
      "description": "Returns system uptime in seconds",
      "parameters": [],
      "is_active": true,
      "return_type": "number",
      "usage_count": 2
    }
  ]
}
```

### Test 22: Built-in Tools (bash tool)

Built-in tools (`bash`, `read`, `write`, `glob`, `grep`, `question`, `todo`, `skill`) are registered automatically and invoked by the LLM during multi-turn conversations. They execute via the Piscina worker thread using `child_process.spawn`.

```
Bash tool execution (via LLM conversation):
  LLM calls bash tool → arg: "ls -la"
    ──▶ Worker thread executes: child_process.spawn("ls", ["-la"])
    ──▶ Captures stdout/stderr with timeout
    ──▶ Returns result string to LLM loop
```

---

## User Management Tests

### Test 23: List Users (admin only)

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "60d5ec4f1234567890abcdef",
        "username": "johndoe",
        "email": "john@example.com",
        "roles": ["user"],
        "is_active": true,
        "last_login": "2026-04-03T10:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### Test 24: Get User by ID (admin only)

```bash
curl -X GET http://localhost:3000/api/users/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["user"],
    "is_active": true,
    "created_at": "2026-04-03T10:30:00.000Z",
    "last_login": "2026-04-03T10:30:00.000Z",
    "preferences": {
      "theme": "light",
      "default_model": "llama-3-8b",
      "language": "en"
    }
  }
}
```

### Test 25: Update User (admin only)

```bash
curl -X PUT http://localhost:3000/api/users/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newjohn@example.com",
    "is_active": true,
    "preferences": {
      "theme": "dark"
    }
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "email": "newjohn@example.com",
    "is_active": true,
    "preferences": {
      "theme": "dark"
    }
  }
}
```

### Test 26: Update User Role (admin only)

```bash
curl -X PATCH http://localhost:3000/api/users/60d5ec4f1234567890abcdef/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["admin"]
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "roles": ["admin"]
  }
}
```

### Test 27: Delete User (admin only)

```bash
curl -X DELETE http://localhost:3000/api/users/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true
}
```

---

## Memory Tests

### Test 28: Fetch Episodic Memories

```bash
curl -X GET http://localhost:3000/api/memory/episodic \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "mem_abc123",
      "user_id": "60d5ec4f1234567890abcdef",
      "layer": "episodic",
      "content": "Discussed RAG architecture and document processing pipeline",
      "tags": ["rag", "architecture", "documents"],
      "metadata": {
        "source_session_id": "67a1b2c3d4e5f6a7b8c9d0e1",
        "keywords": ["RAG", "architecture", "document processing"],
        "confidence": 0.85,
        "extracted_at": "2026-04-03T11:10:00.000Z",
        "expires_at": "2026-05-03T11:10:00.000Z"
      },
      "created_at": "2026-04-03T11:10:00.000Z"
    }
  ]
}
```

### Test 29: Fetch Semantic Memories

```bash
curl -X GET http://localhost:3000/api/memory/semantic \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "mem_def456",
      "user_id": "60d5ec4f1234567890abcdef",
      "layer": "semantic",
      "content": "User works with Node.js and Express for backend development",
      "tags": ["nodejs", "express", "backend"],
      "metadata": {
        "source_session_id": "67a1b2c3d4e5f6a7b8c9d0e1",
        "keywords": ["Node.js", "Express", "backend"],
        "confidence": 0.92,
        "extracted_at": "2026-04-03T11:10:00.000Z"
      },
      "created_at": "2026-04-03T11:10:00.000Z"
    }
  ]
}
```

### Test 30: Fetch Procedural Memories

```bash
curl -X GET http://localhost:3000/api/memory/procedural \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "mem_ghi789",
      "user_id": "60d5ec4f1234567890abcdef",
      "layer": "procedural",
      "content": "prefers concise answers without extra explanation",
      "tags": ["preferences", "communication"],
      "metadata": {
        "source_session_id": "67a1b2c3d4e5f6a7b8c9d0e1",
        "keywords": ["concise", "answers", "prefers"],
        "confidence": 0.78,
        "extracted_at": "2026-04-03T11:10:00.000Z"
      },
      "created_at": "2026-04-03T11:10:00.000Z"
    }
  ]
}
```

### Test 31: Manual Memory Extraction

```bash
curl -X POST http://localhost:3000/api/memory/extract \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "67a1b2c3d4e5f6a7b8c9d0e1"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "extracted": {
      "episodic": [
        {
          "content": "Discussed RAG architecture",
          "confidence": 0.85
        }
      ],
      "semantic": [
        {
          "content": "System uses MongoDB for persistence",
          "confidence": 0.92
        }
      ],
      "procedural": []
    },
    "stored_count": 2,
    "skipped_count": 0
  }
}
```

### Test 32: Delete Memory

```bash
curl -X DELETE http://localhost:3000/api/memory/mem_abc123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true
}
```

---

## Monitor Tests

### Test 33: System Health Check (admin only)

```bash
curl -X GET http://localhost:3000/api/monitor/health \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-03T14:00:00.000Z",
    "uptime": 86400,
    "cpu_usage": 25.5,
    "memory_usage_mb": 512,
    "database_connection": "connected",
    "llama_cpp_status": "running",
    "active_workers": 3
  }
}
```

### Test 34: Get Logs

```bash
curl -X GET "http://localhost:3000/api/logs?limit=10&level=info" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "log_abc123",
        "level": "info",
        "service": "chat-service",
        "message": "Message processed successfully",
        "metadata": {
          "chat_id": "67a1b2c3d4e5f6a7b8c9d0e1",
          "tokens_used": 150
        },
        "timestamp": "2026-04-03T11:05:03.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

## Error Response Examples

### Test 35: 401 Unauthorized (no token)

```bash
curl -X GET http://localhost:3000/api/chat
```

**Expected Response (401):**

```json
{
  "success": false,
  "error": "No token provided"
}
```

### Test 36: 403 Forbidden (insufficient role)

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response (403):**

```json
{
  "success": false,
  "error": "Access denied. Required role: admin"
}
```

### Test 37: 404 Not Found

```bash
curl -X GET http://localhost:3000/api/chat/nonexistent-id \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Expected Response (404):**

```json
{
  "success": false,
  "error": "Chat session not found"
}
```

### Test 38: 429 Too Many Requests

```bash
# After exceeding rate limit
curl -X POST http://localhost:3000/api/chat/67a1b2c3d4e5f6a7b8c9d0e1/llm \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"content": "test"}'
```

**Expected Response (429):**

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later."
}
```

---

## Tags

- `qa` - Quality assurance
- `api-testing` - API test examples
- `curl` - Curl command examples
- `backend` - Backend testing
- `authentication` - Auth testing
- `chat` - Chat endpoint testing
- `rag` - RAG system testing
- `tools` - Tool execution testing

---

## Related Documentation

- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [Request/Response Formats](../api/request-response-formats.md) - Standard response patterns
- [Error Handling](../api/error-handling.md) - Error codes and handling
- [Authentication](../features/authentication.md) - Auth implementation details
- [Chat Sessions](../features/chat-sessions.md) - Chat session features
- [RAG System](../features/rag-system.md) - RAG documentation
- [Persistent Memory](../features/persistent-memory.md) - Memory system
