# QA - API Testing Examples

This document provides practical examples and test cases for the LLM Server API, helping developers understand how to interact with the system and verify functionality.

---

## Overview

These examples demonstrate common API operations and can be used for manual testing, integration testing, or as a reference for writing automated tests.

### Quick Start

```bash
# Start the server
npm run dev

# Test with curl
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "Password123!"}'
```

---

## Authentication Tests

### Test 1: User Registration

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
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

### Test 2: Login

```bash
# Login with registered credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt
```

**Expected Response:**
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

### Test 3: Invalid Login

```bash
# Try login with wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "WrongPassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Test 4: Get Current User

```bash
# Get current user profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
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
    }
  }
}
```

---

## User Management Tests

### Test 5: List Users (Admin)

```bash
# List all users (requires admin token)
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:**
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
    "limit": 10
  }
}
```

### Test 6: Get User by ID

```bash
# Get specific user
curl -X GET http://localhost:3000/api/users/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:**
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

### Test 7: Update User

```bash
# Update user profile
curl -X PUT http://localhost:3000/api/users/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "preferences": {
      "theme": "dark"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "60d5ec4f1234567890abcdef",
    "email": "newemail@example.com",
    "preferences": {
      "theme": "dark"
    }
  }
}
```

### Test 8: Update User Role

```bash
# Update user role to admin
curl -X PATCH http://localhost:3000/api/users/60d5ec4f1234567890abcdef/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

---

## Chat Session Tests

### Test 9: Create Chat Session

```bash
# Create new chat session
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_name": "Project Discussion"
  }'
```

**Expected Response:**
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

### Test 10: List Chat Sessions

```bash
# List all chat sessions
curl -X GET http://localhost:3000/api/chats \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
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

### Test 11: Get Chat Session

```bash
# Get chat session with messages
curl -X GET http://localhost:3000/api/chats/60d5ec4f1234567890abcdef \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
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

### Test 12: Add Message

```bash
# Add message and get response
curl -X POST http://localhost:3000/api/chats/60d5ec4f1234567890abcdef/messages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Explain RAG"
  }'
```

**Expected Response:**
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

## RAG System Tests

### Test 13: Upload Document

```bash
# Upload PDF document
curl -X POST http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_60d5ec4f1234567890abcdef",
    "filename": "document.pdf",
    "file_type": "application/pdf",
    "status": "processing",
    "uploaded_at": "2026-04-03T10:40:00Z"
  }
}
```

### Test 14: List Documents

```bash
# List all documents
curl -X GET http://localhost:3000/api/rag/documents \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_60d5ec4f1234567890abcdef",
      "filename": "document.pdf",
      "file_type": "application/pdf",
      "status": "processed",
      "chunk_count": 45,
      "uploaded_at": "2026-04-03T10:40:00Z"
    }
  ]
}
```

### Test 15: Search Documents

```bash
# Search for relevant content
curl -X POST http://localhost:3000/api/rag/search \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication patterns",
    "top_k": 5,
    "min_score": 0.7
  }'
```

**Expected Response:**
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

## Prompt Management Tests

### Test 16: Create Prompt

```bash
# Create new prompt template
curl -X POST http://localhost:3000/api/prompts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Review Prompt",
    "description": "Review code for best practices",
    "content": "Review the following code for:\n1. Performance issues\n2. Security vulnerabilities",
    "type": "instruct",
    "tags": ["review", "performance"],
    "is_public": false
  }'
```

**Expected Response:**
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

### Test 17: List Prompts

```bash
# List all prompts
curl -X GET http://localhost:3000/api/prompts \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
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

### Test 18: Execute Prompt

```bash
# Execute prompt with variables
curl -X POST http://localhost:3000/api/prompts/execute \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "prompt_60d5ec4f1234567890abcdef",
    "variables": {
      "code": "function add(a, b) { return a + b; }"
    }
  }'
```

**Expected Response:**
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

## Tool Management Tests

### Test 19: Create Tool

```bash
# Create new custom tool
curl -X POST http://localhost:3000/api/tools \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "File Search",
    "description": "Search for files in project",
    "code": "const fs = require('fs');\nfunction searchFiles(pattern) {\n  return fs.readdirSync('./').filter(f => f.includes(pattern));\n}",
    "parameters": [
      {
        "name": "pattern",
        "type": "string",
        "required": true,
        "description": "Search pattern"
      }
    ],
    "is_active": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tool_id": "tool_60d5ec4f1234567890abcdef",
    "name": "File Search",
    "description": "Search for files in project",
    "is_active": true,
    "created_at": "2026-04-03T11:00:00Z"
  }
}
```

### Test 20: Execute Tool

```bash
# Execute tool with parameters
curl -X POST http://localhost:3000/api/tools/tool_60d5ec4f1234567890abcdef/execute \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "*.js"
  }'
```

**Expected Response:**
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

## System Monitoring Tests

### Test 21: Get Logs

```bash
# Get recent logs
curl -X GET "http://localhost:3000/api/logs?limit=10&level=info" \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
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

### Test 22: Get Health Status

```bash
# Get system health
curl -X GET http://localhost:3000/api/monitor/health \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:**
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

## Error Handling Tests

### Test 23: 401 Unauthorized

```bash
# Try accessing protected endpoint without token
curl -X GET http://localhost:3000/api/chats
```

**Expected Response:**
```json
{
  "success": false,
  "error": "No token provided"
}
```

### Test 24: 403 Forbidden

```bash
# Try admin endpoint with user token
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Access denied. Required role: admin"
}
```

### Test 25: 404 Not Found

```bash
# Try non-existent resource
curl -X GET http://localhost:3000/api/chats/nonexistent-id \
  -H "Authorization: Bearer TOKEN"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Chat not found"
}
```

---

## Tags

- `qa` - QA testing
- `examples` - Practical examples
- `api` - API testing

---

## Related Documentation

- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [Request/Response Formats](../api/request-response-formats.md) - Response patterns
- [Error Handling](../api/error-handling.md) - Error codes
