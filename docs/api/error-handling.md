# Error Handling

This document covers error handling in LLM Server, including error codes, HTTP status mappings, and best practices for handling errors.

---

## Overview

The LLM Server uses a consistent error response format and categorizes errors by type and severity. This makes it easy to handle errors programmatically and provides clear feedback to clients.

### Error Response Format

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Response                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  success     │  false                                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  error       │  Error message                                │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  errors      │  Detailed errors (if applicable)             │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Codes

### Authentication Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `AUTH_NOT_PROVIDED` | 401 | No authentication token provided | `POST /api/chats` without token |
| `AUTH_INVALID` | 401 | Invalid or expired token | Token expired |
| `AUTH_UNAUTHORIZED` | 401 | User not authenticated | Token not in header |

### Authorization Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `FORBIDDEN` | 403 | User lacks required permissions | Non-admin accessing admin endpoint |
| `ACCESS_DENIED` | 403 | Access denied for this resource | Trying to delete another user's data |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required role | User trying admin action |

### Validation Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request validation failed | Missing required field |
| `INVALID_INPUT` | 400 | Input doesn't meet requirements | Invalid email format |
| `FIELD_REQUIRED` | 400 | Required field missing | Missing username |
| `INVALID_FORMAT` | 400 | Field has wrong format | Invalid JSON |

### Resource Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `NOT_FOUND` | 404 | Resource not found | Chat session doesn't exist |
| `DUPLICATE` | 409 | Resource already exists | Username already taken |
| `CONFLICT` | 409 | Resource state conflict | Trying to delete active user |
| `ALREADY_EXISTS` | 409 | Resource exists | Email already registered |

### Rate Limiting Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `RATE_LIMITED` | 429 | Too many requests | Exceeded API limit |
| `AUTH_RATE_LIMITED` | 429 | Too many auth attempts | 5+ login attempts |
| `REGISTRATION_RATE_LIMITED` | 429 | Too many registrations | 3+ registrations in 24h |

### Server Errors

| Code | Status | Description | Example |
|------|--------|-------------|---------|
| `INTERNAL_ERROR` | 500 | Internal server error | Unexpected exception |
| `DATABASE_ERROR` | 500 | Database error | Connection lost |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable | Llama.cpp down |

---

## HTTP Status Mapping

### 4xx Client Errors

```
┌─────────────────────────────────────────────────────────────────┐
│                    4xx Status Codes                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  400         │  Bad Request                                  │
│  │              │  Request validation failed                    │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  401         │  Unauthorized                                  │
│  │              │  Authentication required                      │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  403         │  Forbidden                                     │
│  │              │  Authorization required                      │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  404         │  Not Found                                     │
│  │              │  Resource doesn't exist                      │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  409         │  Conflict                                      │
│  │              │  Resource already exists                     │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  429         │  Too Many Requests                            │
│  │              │  Rate limit exceeded                         │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5xx Server Errors

```
┌─────────────────────────────────────────────────────────────────┐
│                    5xx Status Codes                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  500         │  Internal Server Error                        │
│  │              │  Unexpected error                            │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  502         │  Bad Gateway                                   │
│  │              │  Upstream server error                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  503         │  Service Unavailable                          │
│  │              │  External service down                       │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  504         │  Gateway Timeout                               │
│  │              │  Request timeout                              │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

### Server-Side Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Handling Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Request     │                                               │
│  │  arrives     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Middleware  │                                               │
│  │  Chain       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Controller  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Operation   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Success?    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Catch       │                                               │
│  │  error       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Log error   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Format      │                                               │
│  │  error       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  error       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Client-Side Error Handling

### Error Handling Pattern

```javascript
// Axios error handling
axios.interceptors.response.use(
  response => response,
  error => {
    const { response, request } = error;
    
    if (response) {
      const { status, data } = response;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      // Handle rate limiting
      if (status === 429) {
        // Wait and retry
        setTimeout(() => {
          axios.request(request);
        }, 5000);
        return Promise.reject(error);
      }
      
      // Handle other errors
      console.error('API Error:', data.error);
      return Promise.reject(error);
    }
    
    // Handle network errors
    console.error('Network Error:', error.message);
    return Promise.reject(error);
  }
);
```

### Vue Component Error Handling

```javascript
// In Vue component
async function handleSubmit(data) {
  try {
    const response = await axios.post('/api/auth/register', data);
    if (response.data.success) {
      // Success handling
      this.loading = false;
    }
  } catch (error) {
    this.loading = false;
    
    // Display error message
    if (error.response?.data?.error) {
      this.errorMessage = error.response.data.error;
    } else {
      this.errorMessage = 'An error occurred';
    }
  }
}
```

---

## Error Logging

### Error Log Format

```javascript
// Log error with context
logger.error('Operation failed', {
  service: 'chat-service',
  operation: 'sendMessage',
  error: error.message,
  stack: error.stack,
  user_id: req.user?._id,
  request_id: req.headers['x-request-id'],
  metadata: {
    request: req.method + ' ' + req.path,
    response: res.statusCode
  }
});
```

### Error Categories

| Category | Description | Log Level |
|----------|-------------|-----------|
| Validation errors | Input validation failures | warn |
| Authentication errors | Auth failures | info |
| Authorization errors | Permission denials | info |
| Database errors | DB connection issues | error |
| Service errors | External service failures | error |
| Internal errors | Unexpected exceptions | error |

---

## Tags

- `error-handling` - Error handling
- `api` - API errors
- `security` - Auth errors

---

## Related Documentation

- [API Endpoints](./api-endpoints.md) - API reference
- [Request/Response Formats](./request-response-formats.md) - Response patterns
- [Configuration Guide](../technical/configuration-guide.md) - Environment setup
