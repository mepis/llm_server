# Middleware

This document covers the middleware components in LLM Server, including authentication, role-based access control (RBAC), rate limiting, request logging, and error handling.

---

## Overview

Middleware functions are executed during the request-response cycle to perform tasks like authentication, authorization, logging, and error handling before reaching the route handlers.

### Middleware Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Request     │                                               │
│  │  (HTTP)      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  CORS        │  Cross-Origin Resource Sharing                │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Body Parser │  Parse request body                           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Rate        │  Limit requests per time window              │
│  │  Limiter     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │  JWT authentication                           │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  RBAC        │  Role-based access control                   │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Request     │  Log request details                          │
│  │  Logger      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Route       │  Match route handler                          │
│  │  Handler     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Response    │                                               │
│  │  (HTTP)      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Response    │  Log response details                         │
│  │  Logger      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Error       │  Handle errors                                │
│  │  Handler     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Middleware

### Purpose

The authentication middleware verifies JWT tokens and attaches user information to the request object.

### Implementation

```javascript
// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token type'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                           │
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
│  │  Check       │                                               │
│  │  header      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Has token?  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  401 error   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│         │ YES                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Verify      │                                               │
│  │  token       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Token valid?│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  401 error   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│         │ YES                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Attach      │                                               │
│  │  user to     │                                               │
│  │  req.user    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## RBAC Middleware

### Purpose

The RBAC middleware checks if the authenticated user has the required roles to access a route.

### Implementation

```javascript
// src/middleware/rbac.js
export function authorize(allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    
    const hasPermission = allowedRoles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Required role: ' + allowedRoles.join(', ')
      });
    }
    
    next();
  };
}
```

### RBAC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      RBAC Flow                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Protected   │                                               │
│  │  Route       │                                               │
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
│  │  RBAC        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Get        │                                               │
│  │  required    │                                               │
│  │  roles       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check      │                                               │
│  │  user roles  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  User has    │                                               │
│  │  required    │                                               │
│  │  role?       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  403 error   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│         │ YES                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Allow       │                                               │
│  │  access      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Role Examples

```javascript
// Require admin role
app.get('/api/admin/users', authorize(['admin']), handler);

// Require user or admin
app.get('/api/logs', authorize(['user', 'admin']), handler);

// Require system role
app.post('/api/matrix/messages', authorize(['system']), handler);
```

---

## Rate Limiting

### Purpose

Rate limiting prevents abuse by limiting the number of requests from a client within a time window.

### Implementation

```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests
  message: {
    success: false,
    error: 'Too many authentication attempts'
  }
});

export const registrationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each IP to 3 registrations
  message: {
    success: false,
    error: 'Too many registration attempts'
  }
});
```

### Rate Limiting Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Limiting Flow                            │
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
│  │  Check       │                                               │
│  │  request     │                                               │
│  │  count       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Count       │                                               │
│  │  requests    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Limit       │                                               │
│  │  exceeded?   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         │ YES                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  429 error   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│         │ NO                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Increment   │                                               │
│  │  counter     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Allow       │                                               │
│  │  request     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request Logging

### Purpose

Request logging captures details about incoming requests for debugging and monitoring.

### Implementation

```javascript
// src/middleware/requestLogger.js
import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: duration,
      user_id: req.user?._id,
      user_role: req.user?.roles?.[0]
    });
  });
  
  next();
}
```

---

## Error Handling

### Purpose

Error handling middleware catches and handles errors, returning consistent error responses.

### Implementation

```javascript
// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

---

## Middleware Tags

- `middleware` - Express middleware
- `security` - Security best practices
- `authentication` - User authentication
- `admin` - Administrative privileges

---

## Related Documentation

- [Authentication](./authentication.md) - Auth flow details
- [API Endpoints](../api/api-endpoints.md) - Route definitions
- [Configuration Guide](../technical/configuration-guide.md) - Environment setup
