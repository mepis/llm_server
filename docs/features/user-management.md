# User Management

This document covers the user management system in LLM Server, including CRUD operations, profile updates, role assignment, and user preferences.

---

## Overview

The user management system provides comprehensive user administration with the following capabilities:

- Create, read, update, and delete users
- Update user profiles and preferences
- Assign and manage user roles
- Track user activity and login history
- Support for pagination and filtering

### User Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Schema                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  username    │  String (unique, 3-50 chars)                 │
│  │  email       │  String (unique, lowercase)                  │
│  │  password    │  String (Argon2 hash)                        │
│  │  roles       │  String[] (user, admin, system)              │
│  │  is_active   │  Boolean                                      │
│  │  created_at  │  Timestamp                                    │
│  │  last_login  │  Timestamp                                    │
│  │  preferences │  Object                                       │
│  │              │  ┌──────────────┐                            │
│  │              │  │ theme        │  String (light/dark)       │
│  │              │  │ default_model│  String (model name)       │
│  │              │  │ language     │  String (ISO code)        │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CRUD Operations

### Create User

Users are created through the registration endpoint. Admin users can also be created programmatically.

```javascript
// Service layer
async function createUser(username, email, password, roles = ['user']) {
  // Validate input
  // Hash password with Argon2
  // Create user document
  // Return user data (without password)
}
```

### Read Users

#### List All Users (Admin Only)

```
GET /api/users?page=1&limit=20&role=user&active=true
```

#### Get User by ID (Admin Only)

```
GET /api/users/:id
```

### Update User

#### Update Profile (User or Admin)

```
PUT /api/users/:id
```

#### Update User Role (Admin Only)

```
PATCH /api/users/:id/role
```

### Delete User

#### Delete User (Admin Only)

```
DELETE /api/users/:id
```

---

## User Preferences

Users can customize their experience through preferences stored in the database.

### Available Preferences

| Preference | Type | Options | Description |
|------------|------|---------|-------------|
| `theme` | String | `light`, `dark` | UI theme |
| `default_model` | String | Model names | Default LLM model |
| `language` | String | ISO codes (e.g., `en`) | Interface language |

### Preference Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Preferences Schema                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  theme       │  User interface theme                         │
│  │    (light)   │                                                │
│  │              │                                                │
│  │  ┌──────────┴──────────┐                                    │
│  │  │  default_model       │  Llama.cpp model name              │
│  │  │  (llama-3-8b)       │                                     │
│  │  │                     │                                     │
│  │  │  ┌────────────────┴──────────┐                          │
│  │  │  │  language                 │  ISO 639-1 code          │
│  │  │  │  (en)                    │                           │
│  │  │  └──────────────────────────┘                          │
│  │  └──────────────┘                                          │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Role Management

### Role Hierarchy

```
                     ┌─────────┐
                     │  system │
                     │  (Bot)  │
                     └────┬────┘
                          │
                         ▼
          ┌──────────────────────────┐
          │                          │
    ┌─────┴─────┐            ┌───────┴───────┐
    │   admin   │            │               │
    │           │            │               │
  ┌──┴───┐     ┌──┴────┐   ┌──┴────┐       ┌──┴───┐
  │ user │     │       │   │ logs  │       │ matrix│
  │      │     │       │   │       │       │       │
  │chat  │     │prompts│   │ view  │       │ bot   │
  │sess  │     │tools  │   │ access│       │ hooks │
  └──────┘     └───────┘   └───────┘       └──────┘
```

**Legend:**
- **system**: Bot-level access (Matrix integration, system monitoring)
- **admin**: Administrative privileges (user management, system config)
- **user**: Standard user access (chat, RAG, prompts, tools)
┌─────────────────────────────────────────────────────────────────┐
│                        Role Hierarchy                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ┌─────────┐                             │
│                         │  system │                             │
│                         │  (Bot)  │                             │
│                         └────┬────┘                             │
│                             │                                    │
│                             ▼                                    │
│                    ┌────────┴────────┐                          │
│                    │                  │                          │
│                   ┌───┐            ┌──────┐                    │
│                   │   │            │      │                    │
│                  ┌─┴─┐          ┌──┴─────┤                    │
│                  │   │          │        │                    │
│                 ┌─┴─┐        ┌──┴────┐   │                    │
│                 │   │        │       │   │                    │
│                ┌─┴─┐      ┌──┴────┐ ┌─┴─┐                    │
│                │   │      │       │ │   │                    │
│               ┌─┴─┐    ┌──┴────┐ ┌─┴─┐                        │
│               │   │    │       │ │   │                        │
│              ┌─┴─┐  ┌──┴────┐ ┌─┴─┐                            │
│              │   │  │       │ │   │                            │
│             ┌─┴─┐┌─┴─┐   ┌──┴────┐┌─┴─┐                        │
│             │   ││   │   │       ││   │                        │
│            ┌─┴─┐┌─┴─┐ ┌─┴─┐   ┌──┴────┐┌─┴─┐                  │
│            │   ││   │ │   │   │       ││   │                  │
│           ┌─┴─┐┌─┴─┐ │   │   │       ││   │                  │
│           │   ││   │ │   │   │       ││   │                  │
│          ┌─┴─┐┌─┴─┐ │   │   └─────────┘┌─┴─┐                │
│          │   ││   │ │   │               │   │                │
│         ┌─┴─┐┌─┴─┐ │   │                │   │                │
│         │   ││   │ │   │                │   │                │
│        ┌─┴─┐┌─┴─┐ │   │                 │   │                │
│        │   ││   │ │   │                 │   │                │
│       ┌─┴─┐┌─┴─┐ │   │                  │   │                │
│       │   ││   │ │   │                  │   │                │
│      ┌─┴─┐┌─┴─┐ │   │                   │   │                │
│      │   ││   │ │   │                   │   │                │
│     ┌─┴─┐┌─┴─┐ │   │                    │   │                │
│     │   ││   │ │   │                    │   │                │
│    ┌─┴─┐┌─┴─┐ │   │                     │   │                │
│    │   ││   │ │   │                     │   │                │
│   ┌─┴─┐┌─┴─┐ │   │                      │   │                │
│   │   ││   │ │   │                      │   │                │
│  ┌─┴─┐┌─┴─┐ │   │                       │   │                │
│  │   ││   │ │   │                       │   │                │
│ ┌─┴─┐┌─┴─┐ │   │                        │   │                │
│ │   ││   │ │   │                        │   │                │
│┌─┴─┐┌─┴─┐ │   │                         │   │                │
││   ││   │ │   │                         │   │                │
│└─┴─┘└─┴─┘ │   │                         │   │                │
│  user     │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
│           │   │                         │   │                │
└───────────┴───┴─────────────────────────┴───┴───────────────┘
```

### Role Capabilities Matrix

| Capability | `user` | `admin` | `system` |
|------------|--------|---------|----------|
| Create chat sessions | ✅ | ✅ | ❌ |
| Use RAG features | ✅ | ✅ | ❌ |
| Create prompts | ✅ | ✅ | ❌ |
| Create tools | ✅ | ✅ | ❌ |
| View logs | ✅ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ❌ |
| Delete users | ❌ | ✅ | ❌ |
| Matrix integration | ❌ | ❌ | ✅ |
| System monitoring | ❌ | ✅ | ✅ |

---

## Profile Updates

### Update User Profile

Users can update their email and preferences.

```javascript
// Request body
{
  "email": "newemail@example.com",
  "preferences": {
    "theme": "dark",
    "default_model": "llama-3-8b",
    "language": "en"
  }
}
```

### Profile Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Profile Update Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  update      │                                               │
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
│  │  Find User   │                                               │
│  │  by ID       │                                               │
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
│  │  Update User│                                               │
│  │  document    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Set        │                                               │
│  │  last_login │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return     │                                               │
│  │  updated    │                                               │
│  │  user       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Activity Tracking

The system tracks user activity for monitoring and analytics purposes.

### Activity Fields

| Field | Type | Description |
|-------|------|-------------|
| `last_login` | Timestamp | Last successful login |
| `login_count` | Number | Total number of logins |
| `created_at` | Timestamp | User account creation |
| `updated_at` | Timestamp | Last profile update |

### Activity Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Activity Tracking Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  User logs   │                                               │
│  │  in          │                                               │
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
│  │  document    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Update      │                                               │
│  │  fields:     │                                               │
│  │  - last_login│                                               │
│  │  - login_count│                                             │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Log activity│                                               │
│  │  to logs     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  token       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | List all users (admin) | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id` | Update user profile | Admin |
| DELETE | `/api/users/:id` | Delete user (admin) | Admin |
| PATCH | `/api/users/:id/role` | Update user role | Admin |

### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update profile | Yes |

### Example API Usage

```bash
# List all users (admin)
curl -X GET "http://localhost:3000/api/users?page=1&limit=20" \
  -H "Authorization: Bearer admin_token"

# Get specific user (admin)
curl -X GET "http://localhost:3000/api/users/60d5ec4f1234567890abcdef" \
  -H "Authorization: Bearer admin_token"

# Update user profile (admin)
curl -X PUT "http://localhost:3000/api/users/60d5ec4f1234567890abcdef" \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "preferences": {
      "theme": "dark"
    }
  }'

# Update user role (admin)
curl -X PATCH "http://localhost:3000/api/users/60d5ec4f1234567890abcdef/role" \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'

# Delete user (admin)
curl -X DELETE "http://localhost:3000/api/users/60d5ec4f1234567890abcdef" \
  -H "Authorization: Bearer admin_token"
```

---

## Tags

### Core
- `user-management` - User CRUD operations
- `admin` - Administrative privileges
- `security` - Security best practices
- `authentication` - User authentication
- `profiles` - User profile management
- `roles` - Role-based access control

### Technical
- `caching` - Response caching strategies
- `streaming` - Response streaming flow
- `pagination` - Data pagination patterns
- `batch-operations` - Bulk user operations
- `query-optimization` - Database query optimization

### Workflow
- `workflows` - Multi-step workflows
- `multi-turn-chat` - Conversation management
- `complete-pipeline` - End-to-end pipeline
- `retry-patterns` - Retry logic and backoff

---

## Related Documentation

- [Authentication](./authentication.md) - User login and registration
- [Middleware](../components/middleware.md) - Authentication and RBAC middleware
- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [Security Design](../architecture/security-design.md) - Security architecture

---

## Practical Examples

### Example 1: Create Admin User

```javascript
const { MongoClient } = require('mongodb');

async function createAdminUser(username, email, password) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('llm_server');
    const users = db.collection('users');
    
    const user = {
      username,
      email,
      password_hash: await hashPassword(password),
      roles: ['admin'],
      is_active: true,
      created_at: new Date()
    };
    
    const result = await users.insertOne(user);
    return result.insertedId;
  } finally {
    await client.close();
  }
}
```

### Example 2: Update User Role

```javascript
async function updateUserRole(userId, newRole) {
  const db = await getDB();
  
  const update = {
    $set: {
      'roles.$[elem]': newRole
    }
  };
  
  const result = await db
    .collection('users')
    .updateOne(
      { _id: userId },
      update,
      { arrayFilters: [{ 'elem': newRole }] }
    );
  
  return result;
}
```

### Example 3: Get User Statistics

```javascript
async function getUserStats(userId) {
  const db = await getDB();
  
  const user = await db.collection('users').findOne({ _id: userId });
  const sessions = await db.collection('chats').countDocuments({ user_id: userId });
  
  return {
    username: user.username,
    email: user.email,
    created_at: user.created_at,
    last_login: user.last_login,
    chat_sessions: sessions
  };
}
```
