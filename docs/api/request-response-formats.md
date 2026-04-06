# Request/Response Formats

This document defines the standard request and response formats used throughout the LLM Server API, ensuring consistency across all endpoints.

---

## Overview

All API endpoints follow a consistent response format pattern, making it easy to parse responses programmatically. Request formats are standardized for each endpoint type.

### Standard Response Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Response Format                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  success     │  Boolean                                      │
│  │              │  Indicates operation success                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  data        │  Operation result (if success)                │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  error       │  Error message (if success is false)         │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Responses

### Success Response Structure

```json
{
  "success": true,
  "data": {
    // Operation-specific data
  }
}
```

### List Response Pattern

Used for endpoints returning arrays of items.

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Pagination Response Pattern

```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Error Responses

### Error Response Structure

```json
{
  "success": false,
  "error": "Error message"
}
```

### Detailed Error Response

```json
{
  "success": false,
  "error": "Invalid input",
  "errors": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters",
      "code": "FIELD_VALIDATION"
    }
  ]
}
```

---

## Common Request Formats

### Authentication Request

Used for login and registration.

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Create/Update Request

Used for creating or updating resources.

```json
{
  "name": "string",
  "description": "string",
  "content": "string",
  "is_active": true
}
```

### Search Request

Used for search operations.

```json
{
  "query": "string",
  "top_k": 5,
  "min_score": 0.7
}
```

### Filter Request

Used for filtering operations.

```json
{
  "filters": {
    "status": "processed",
    "role": "user"
  },
  "sort": {
    "field": "created_at",
    "order": "desc"
  },
  "limit": 20,
  "offset": 0
}
```

---

## Specific Endpoint Formats

### Chat Message Request

```json
{
  "content": "string",
  "role": "user"
}
```

### Chat Response

```json
{
  "message_id": "string",
  "role": "assistant",
  "content": "string",
  "timestamp": "2026-04-03T10:35:00Z",
  "tokens_used": 150,
  "context_used": [
    {
      "document_id": "string",
      "content": "string",
      "score": 0.92
    }
  ]
}
```

### LLM Chat Completion Response

```json
{
  "id": "string",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "string"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 150,
    "total_tokens": 165
  },
  "model": "string"
}
```

### Embedding Response

```json
{
  "model": "string",
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.1, 0.2, ...],
      "index": 0
    }
  ]
}
```

### RAG Search Response

```json
{
  "data": [
    {
      "document_id": "string",
      "content": "string",
      "score": 0.92,
      "chunk_index": 0
    }
  ]
}
```

### Tool Execution Response

```json
{
  "result": "string",
  "execution_time_ms": 15,
  "usage_count": 1
}
```

---

## Query Parameters

### Standard Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |
| `sort` | String | Sort field |
| `order` | String | Sort order (asc/desc) |
| `filter` | String | Filter condition |

### Example

```
GET /api/users?page=1&limit=20&sort=created_at&order=desc
```

---

## Headers

### Standard Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <token>` | JWT token |
| `Content-Type` | `application/json` | Request body type |
| `Accept` | `application/json` | Response type |

### Example

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

---

## File Upload Format

### Multipart Form Data

```
Content-Type: multipart/form-data

file: <Binary File>
```

### Example

```
POST /api/rag/documents
Content-Type: multipart/form-data

file: document.pdf
```

---

## Tags

- `api` - API formats
- `request-response` - Request/response patterns
- `authentication` - Auth formats

---

## Related Documentation

- [API Endpoints](./api-endpoints.md) - Complete API reference
- [Error Handling](./error-handling.md) - Error codes and handling
- [Configuration Guide](../technical/configuration-guide.md) - Environment setup
