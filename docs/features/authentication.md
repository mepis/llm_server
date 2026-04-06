# Authentication & Authorization

This document covers the authentication and authorization system in LLM Server, including user registration, login, JWT tokens, password hashing, and role-based access control (RBAC).

---

## Overview

The authentication system provides secure user management with the following capabilities:

- User registration with validation
- Password hashing using Argon2id
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting for API protection

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| `user` | Standard user | Chat, RAG, prompts, tools |
| `admin` | Administrator | User management, all features |
| `system` | System account | Monitoring, Matrix integration |

---

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   Client    │     │  Server     │
│  Request    │────▶│  (Browser)  │────▶│  (Express)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ 1. Register       │                   │
       │  POST /register   │                   │
       │  (username,       │                   │
       │   email, pass)    │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Server    │     │   Client    │     │   Database  │
│  Validates  │◀────│  Receives   │────▶│  (MongoDB)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ 2. Hashes        │                   │
       │    password      │                   │
       │    with Argon2   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Server    │     │   Client    │     │  User Doc   │
│  Returns    │◀────│  Stores     │◀────│  (username, │
│  success    │     │  token      │     │   email,    │
│             │     │             │     │   hash)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Registration

### Endpoint

```
POST /api/auth/register
```

### Request Body

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Validation Rules

| Field | Type | Rules |
|-------|------|-------|
| `username` | String | 3-50 characters, alphanumeric and underscores |
| `email` | String | Valid email format, unique |
| `password` | String | Minimum 12 characters, must include uppercase, lowercase, and number |

### Response (Success)

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

### Registration Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    Registration Flow Diagram                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  credentials │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Middleware  │                                               │
│  │  Validates   │                                               │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Password    │                                               │
│  │  Hashing     │                                               │
│  │  (Argon2)    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create User│                                               │
│  │  in DB       │                                               │
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

## Login

### Endpoint

```
POST /api/auth/login
```

### Request Body

```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

### Response (Success)

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

### Login Process

```
┌─────────────────────────────────────────────────────────────────┐
│                        Login Flow Diagram                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  credentials │                                               │
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
│  │  Find User   │                                               │
│  │  by username │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Verify      │                                               │
│  │  password    │                                               │
│  │  (Argon2)    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  JWT token   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  token +     │                                               │
│  │  user data   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Password Hashing

The system uses **Argon2id** for password hashing, which is the current NIST-recommended algorithm.

### Worker Thread Implementation

Password hashing is performed in a separate worker thread using the `piscina` worker pool to prevent blocking the main thread.

```javascript
// Worker message format
{
  type: 'hashPassword',
  data: { password: string },
  requestId: string
}

{
  type: 'verifyPassword',
  data: { password: string, hash: string },
  requestId: string
}
```

### Hash Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Algorithm | Argon2id | Memory-hard hashing |
| Memory Cost | 65536 | 64 MB |
| Time Cost | 3 | Iterations |
| Parallelism | 1 | CPU threads |

### Hashing Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    Password Hashing Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Main Thread│                                               │
│  │  receives    │                                               │
│  │  password    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Send to     │                                               │
│  │  Worker Pool │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  Thread      │                                               │
│  │  (Argon2)    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  hash        │                                               │
│  │  to main     │                                               │
│  │  thread      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Hash Verification

```javascript
import * as argon2 from 'argon2';

// Hash a password
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1
});

// Verify a password
const isValid = await argon2.verify(hash, password);
```

---

## JWT Authentication

### Token Structure

The JWT token contains the following claims:

```json
{
  "sub": "60d5ec4f1234567890abcdef",  // User ID
  "username": "johndoe",
  "email": "john@example.com",
  "roles": ["user"],
  "iat": 1712345678,                  // Issued at
  "exp": 1712950478                   // Expires at (7 days)
}
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        JWT Token Lifecycle                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Login       │                                               │
│  │  successful  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Store token │                                               │
│  │  in storage  │                                               │
│  │  (localStorage/│     ┌──────────────┐                    │
│  │   cookie)    │──────▶│  Request     │                    │
│  │              │       │  includes    │                    │
│  └──────────────┘       │  Authorization│                    │
│         │               │  header       │                    │
│         │               └──────┬────────┘                    │
│         │                      ▼                              │
│         │              ┌──────────────┐                       │
│         │              │  Middleware  │                       │
│         │              │  validates   │                       │
│         │              │  token       │                       │
│         │              └──────┬───────┘                       │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              ┌──────────────┐                         │
│         │              │  Attach user │                         │
│         │              │  to req.user │                         │
│         │              └──────────────┘                         │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              ┌──────────────┐                         │
│         │              │  Proceed to  │                         │
│         │              │  protected   │                         │
│         │              │  route       │                         │
│         │              └──────────────┘                         │
│         │                     │                                 │
│         │                     ▼                                 │
│         │              ┌──────────────┐                         │
│         │              │  Token       │                         │
│         │              │  expires     │                         │
│         │              │  (7 days)    │                         │
│         │              └──────────────┘                         │
│         ▼                                                         │
│  ┌──────────────┐                                               │
│  │  Logout      │                                               │
│  │  (optional)  │                                               │
│  │  Invalidate  │                                               │
│  │  token       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Access Control (RBAC)

### Middleware

The RBAC middleware checks user roles and permissions for protected routes.

```javascript
// Example: Require admin role
app.get('/api/admin/users', authorize(['admin']), (req, res) => {
  // Only admin users can access this route
});

// Example: Require system role
app.post('/api/matrix/messages', authorize(['system']), (req, res) => {
  // Only system users can send Matrix messages
});

// Example: Require user or admin
app.get('/api/logs', authorize(['user', 'admin']), (req, res) => {
  // Both users and admins can view logs
});
```

### Role Definitions

| Role | Can View Logs | Can Manage Users | Can Use Chat | Can Use RAG | Can Use Matrix |
|------|---------------|------------------|--------------|-------------|----------------|
| `user` | ✅ | ❌ | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `system` | ✅ | ❌ | ❌ | ❌ | ✅ |

### RBAC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC Check Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Protected   │                                               │
│  │  Route       │                                               │
│  │  /api/users  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │  checks      │                                               │
│  │  token       │                                               │
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
│  │  Check       │                                               │
│  │  required    │                                               │
│  │  roles       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  User has    │                                               │
│  │  'admin'     │                                               │
│  │  role?       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  YES:        │                                               │
│  │  Allow       │                                               │
│  │  access      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  NO:         │                                               │
│  │  Return      │                                               │
│  │  403 error   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT | No |
| POST | `/api/auth/logout` | Logout | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| PATCH | `/api/users/:id/role` | Update user role | Admin |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update profile | Yes |

---

## Tags

- `auth` - Authentication and authorization
- `user-management` - User CRUD operations
- `jwt` - JWT authentication
- `argon2` - Password hashing
- `security` - Security best practices
- `admin` - Administrative privileges
- `system` - System-level operations

---

## Related Documentation

- [User Management](./user-management.md) - User CRUD operations
- [Middleware](../components/middleware.md) - Authentication and RBAC middleware
- [Security Design](../architecture/security-design.md) - Security architecture
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

### Example 2: Login and Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt
```

### Example 3: Make Authenticated Request

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 4: Admin Action with RBAC

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer admin_token_here"
```

---

## Troubleshooting

### Common Issues

1. **Password hashing too slow**
   - Ensure worker pool is configured with sufficient threads
   - Check system resources (CPU, memory)

2. **JWT token expired**
   - Tokens expire after 7 days by default
   - Implement token refresh mechanism if needed

3. **403 Forbidden on protected route**
   - Verify user has required role
   - Check RBAC middleware configuration

4. **401 Unauthorized**
   - Missing Authorization header
   - Invalid or expired JWT token
