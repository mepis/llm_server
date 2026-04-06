# API Endpoints

This document provides a comprehensive reference for all REST API endpoints in LLM Server, including authentication, user management, chat sessions, RAG, prompts, tools, and system monitoring.

---

## Overview

The LLM Server API follows REST conventions with consistent response formats, authentication via JWT tokens, and role-based access control.

### Base URL

```
http://localhost:3000/api
```

### Authentication

All endpoints requiring authentication use the Bearer token pattern:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User

Creates a new user account.

```
POST /api/auth/register
```

#### Request

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Response (201 Created)

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

#### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid input | Missing or invalid fields |
| 409 | Username/email exists | Account already exists |
| 400 | Password too weak | Password doesn't meet requirements |

---

### Login

Authenticates a user and returns a JWT token.

```
POST /api/auth/login
```

#### Request

```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "60d5ec4f1234567890abcdef",
      "username": "johndoe",
      "email": "john@example.com",
      "roles": ["user"]
    }
  }
}
```

#### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Invalid credentials | Wrong username or password |
| 403 | Account inactive | User account is disabled |

---

### Logout

Invalidates the current session token.

```
POST /api/auth/logout
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Get Current User

Retrieves the authenticated user's profile.

```
GET /api/auth/me
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

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
    "created_at": "2026-04-03T10:30:00Z"
  }
}
```

---

## User Management Endpoints

### List Users

Lists all users (admin only).

```
GET /api/users
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |
| `role` | String | Filter by role |
| `active` | Boolean | Filter by active status |

#### Response (200 OK)

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
        "last_login": "2026-04-03T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get User

Retrieves a specific user by ID (admin only).

```
GET /api/users/:id
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["user"],
    "is_active": true,
    "created_at": "2026-04-03T10:30:00Z",
    "last_login": "2026-04-03T10:30:00Z",
    "preferences": {
      "theme": "light",
      "default_model": "llama-3-8b",
      "language": "en"
    }
  }
}
```

---

### Update User

Updates a user's profile (admin only).

```
PUT /api/users/:id
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Request

```json
{
  "email": "newemail@example.com",
  "preferences": {
    "theme": "dark",
    "default_model": "llama-3-8b"
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "email": "newemail@example.com",
    "preferences": {
      "theme": "dark",
      "default_model": "llama-3-8b"
    }
  }
}
```

---

### Delete User

Deletes a user account (admin only).

```
DELETE /api/users/:id
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Update User Role

Updates a user's role (admin only).

```
PATCH /api/users/:id/role
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Request

```json
{
  "role": "admin"
}
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

## Chat Session Endpoints

### Create Chat Session

Creates a new chat session.

```
POST /api/chats
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

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

#### Response (201 Created)

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

---

### List Chat Sessions

Lists all chat sessions for the current user.

```
GET /api/chats
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "chat_id": "60d5ec4f1234567890abcdef",
      "session_name": "Project Discussion",
      "last_message": "Hello",
      "updated_at": "2026-04-03T10:30:00Z"
    }
  ]
}
```

---

### Get Chat Session

Retrieves a specific chat session with messages.

```
GET /api/chats/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "chat_id": "60d5ec4f1234567890abcdef",
    "session_name": "Project Discussion",
    "messages": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2026-04-03T10:30:00Z"
      },
      {
        "role": "assistant",
        "content": "Hi there! How can I help you?",
        "timestamp": "2026-04-03T10:30:05Z"
      }
    ],
    "memory": {
      "conversation_summary": "User asked for greeting",
      "key_points": [],
      "entities": [],
      "preferences": {}
    }
  }
}
```

---

### Update Chat Session

Updates a chat session.

```
PUT /api/chats/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "session_name": "Updated Name"
}
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Delete Chat Session

Deletes a chat session.

```
DELETE /api/chats/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Add Message

Adds a message to a chat session and receives LLM response.

```
POST /api/chats/:id/messages
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "content": "Explain the RAG functionality"
}
```

#### Response (200 OK)

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

---

### Update Chat Memory

Updates chat memory (context and summary).

```
PUT /api/chats/:id/memory
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "conversation_summary": "Discussion about RAG",
  "key_points": [
    "RAG retrieves relevant documents",
    "Improves response accuracy"
  ],
  "entities": ["RAG", "semantic search"],
  "preferences": {}
}
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

## LLM Integration Endpoints

### List Models

Lists available Llama.cpp models.

```
GET /api/llama/models
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "llama-3-8b",
      "name": "llama-3-8b-instruct",
      "size": 4978592000,
      "format": "gguf",
      "quantization": "q4_0",
      "parameters": 8
    }
  ]
}
```

---

### Chat Completion

Sends a chat completion request to Llama.cpp.

```
POST /api/llama/chat/completions
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "model": "llama-3-8b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain RAG"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 2048,
  "top_p": 0.9
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "RAG (Retrieval-Augmented Generation)..."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 15,
      "completion_tokens": 150,
      "total_tokens": 165
    },
    "model": "llama-3-8b"
  }
}
```

---

### Generate Embeddings

Generates vector embeddings for text.

```
POST /api/llama/embeddings
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "model": "all-MiniLM-L6-v2",
  "input": [
    "What is RAG?",
    "Explain semantic search"
  ]
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "model": "all-MiniLM-L6-v2",
    "object": "list",
    "data": [
      {
        "object": "embedding",
        "embedding": [0.0023064255, -0.009327292, ...],
        "index": 0
      }
    ]
  }
}
```

---

### Health Check

Checks Llama.cpp server status.

```
GET /api/llama/health
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-03T10:30:00Z",
    "uptime": 86400,
    "cpu_usage": 25.5,
    "memory_usage": 512,
    "active_contexts": 1,
    "llama_version": "0.1.40"
  }
}
```

---

## RAG System Endpoints

### Upload Document

Uploads a document for RAG processing.

```
POST /api/rag/documents
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request (multipart/form-data)

```
file: <Binary File>
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "document_id": "doc_60d5ec4f1234567890abcdef",
    "filename": "api_design.pdf",
    "file_type": "application/pdf",
    "status": "processing",
    "uploaded_at": "2026-04-03T10:40:00Z"
  }
}
```

---

### List Documents

Lists all documents for the current user.

```
GET /api/rag/documents
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_60d5ec4f1234567890abcdef",
      "filename": "api_design.pdf",
      "file_type": "application/pdf",
      "status": "processed",
      "chunk_count": 45,
      "uploaded_at": "2026-04-03T10:40:00Z"
    }
  ]
}
```

---

### Get Document

Retrieves a specific document.

```
GET /api/rag/documents/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "document_id": "doc_60d5ec4f1234567890abcdef",
    "filename": "api_design.pdf",
    "file_type": "application/pdf",
    "content": "Extracted text content...",
    "chunks": [...],
    "status": "processed"
  }
}
```

---

### Delete Document

Deletes a document and its embeddings.

```
DELETE /api/rag/documents/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Search Documents

Searches documents for relevant content.

```
POST /api/rag/search
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "query": "authentication patterns",
  "top_k": 5,
  "min_score": 0.7
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_abc123",
      "content": "JWT tokens provide stateless authentication...",
      "score": 0.92,
      "chunk_index": 12
    }
  ]
}
```

---

### Get Chunks

Retrieves chunks for a document.

```
GET /api/rag/documents/:id/chunks
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "chunk_index": 0,
      "text": "First chunk of text...",
      "embedding": [0.1, 0.2, ...],
      "tokens": 150
    }
  ]
}
```

---

## Prompt Management Endpoints

### Create Prompt

Creates a new prompt template.

```
POST /api/prompts
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "name": "Code Review Prompt",
  "description": "Review code for best practices",
  "content": "Review the following code for:\n1. Performance issues\n2. Security vulnerabilities",
  "type": "instruct",
  "tags": ["review", "performance"],
  "is_public": false,
  "variables": [
    {
      "name": "code",
      "description": "The code to review",
      "required": true,
      "type": "string"
    }
  ],
  "settings": {
    "temperature": 0.7,
    "max_tokens": 2048
  }
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "name": "Code Review Prompt",
    "type": "instruct",
    "is_public": false,
    "created_at": "2026-04-03T10:50:00Z"
  }
}
```

---

### List Prompts

Lists all prompts for the current user.

```
GET /api/prompts
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "prompt_id": "prompt_60d5ec4f1234567890abcdef",
      "name": "Code Review Prompt",
      "type": "instruct",
      "tags": ["review", "performance"],
      "is_public": false,
      "created_at": "2026-04-03T10:50:00Z"
    }
  ]
}
```

---

### Get Prompt

Retrieves a specific prompt.

```
GET /api/prompts/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "name": "Code Review Prompt",
    "content": "Review the following code...",
    "type": "instruct",
    "tags": ["review", "performance"],
    "is_public": false
  }
}
```

---

### Update Prompt

Updates a prompt template.

```
PUT /api/prompts/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Delete Prompt

Deletes a prompt template.

```
DELETE /api/prompts/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Execute Prompt

Executes a prompt with variables.

```
POST /api/prompts/execute
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "prompt_id": "prompt_60d5ec4f1234567890abcdef",
  "variables": {
    "code": "function add(a, b) { return a + b; }"
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "output": "Here's a review...",
    "usage_count": 1,
    "tokens_used": 150,
    "execution_time_ms": 245
  }
}
```

---

## Tool Management Endpoints

### Create Tool

Creates a new custom tool.

```
POST /api/tools
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "name": "File Search",
  "description": "Search for files in the project",
  "code": "const fs = require('fs');\nfunction searchFiles(pattern) {\n  return fs.readdirSync('./').filter(f => f.includes(pattern));\n}",
  "parameters": [
    {
      "name": "pattern",
      "type": "string",
      "required": true,
      "description": "Search pattern"
    }
  ],
  "is_active": true,
  "return_type": "array"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "tool_id": "tool_60d5ec4f1234567890abcdef",
    "name": "File Search",
    "description": "Search for files in the project",
    "is_active": true,
    "created_at": "2026-04-03T11:00:00Z"
  }
}
```

---

### List Tools

Lists all tools for the current user.

```
GET /api/tools
```

#### Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `active` | boolean | Filter by active status |
| `search` | string | Search by name or description |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "tool_id": "tool_60d5ec4f1234567890abcdef",
      "name": "File Search",
      "description": "Search for files in the project",
      "parameters": [
        {
          "name": "pattern",
          "type": "string",
          "required": true
        }
      ],
      "is_active": true,
      "usage_count": 5
    }
  ]
}
```

---

### Execute Tool

Executes a tool with parameters.

```
POST /api/tools/:id/execute
```

#### Headers

```
Authorization: Bearer <token>
```

#### Request

```json
{
  "pattern": "*.js"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "result": ["app.js", "config.js", "server.js"],
    "execution_time_ms": 15,
    "usage_count": 1
  }
}
```

---

### Update Tool

Updates a tool.

```
PUT /api/tools/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

### Delete Tool

Deletes a tool.

```
DELETE /api/tools/:id
```

#### Headers

```
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "success": true
}
```

---

## System Monitoring Endpoints

### Get Logs

Retrieves application logs.

```
GET /api/logs
```

#### Headers

```
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `level` | String | Log level filter (info, warn, error) |
| `service` | String | Service name filter |
| `since` | String | Start timestamp (ISO 8601) |
| `limit` | Number | Maximum records (default: 100) |

#### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "log_id": "log_60d5ec4f1234567890abcdef",
      "level": "info",
      "service": "chat-service",
      "message": "Message processed successfully",
      "metadata": {
        "chat_id": "chat_abc123",
        "tokens": 150
      },
      "timestamp": "2026-04-03T10:30:00Z"
    }
  ]
}
```

---

### System Health

Returns system health status.

```
GET /api/monitor/health
```

#### Headers

```
Authorization: Bearer <admin_token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-03T10:30:00Z",
    "uptime": 86400,
    "cpu_usage": 25.5,
    "memory_usage": 512,
    "database_connection": "connected",
    "llama_cpp_status": "running",
    "active_workers": 3
  }
}
```

---

## Matrix Integration Endpoints

### Handle Matrix Message

Receives incoming Matrix messages.

```
POST /api/matrix/messages
```

#### Headers

```
Authorization: Bearer <system_token>
```

#### Request

```json
{
  "room_id": "!abc123:matrix.org",
  "sender": "@user:matrix.org",
  "content": "What is RAG?",
  "timestamp": "2026-04-03T10:30:00Z"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message_id": "msg_mat_60d5ec4f1234567890abcdef",
    "auto_created_user": true,
    "response": "RAG (Retrieval-Augmented Generation)..."
  }
}
```

---

### Send Matrix Message

Sends an outgoing Matrix message.

```
POST /api/matrix/send
```

#### Headers

```
Authorization: Bearer <system_token>
```

#### Request

```json
{
  "room_id": "!abc123:matrix.org",
  "content": "Response to your query"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message_id": "msg_mat_out_60d5ec4f1234567890abcdef"
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Tags

- `api` - API endpoints
- `authentication` - User authentication
- `user-management` - User CRUD operations
- `chat` - Chat session management
- `rag` - Retrieval-augmented generation
- `prompts` - Prompt management
- `tools` - Custom tool execution
- `monitoring` - System monitoring

---

## Related Documentation

- [Request/Response Formats](./request-response-formats.md) - Standard response patterns
- [Error Handling](./error-handling.md) - Error codes and handling
- [Authentication](../features/authentication.md) - Auth implementation
- [API Endpoints](./api-endpoints.md) - Complete API reference
