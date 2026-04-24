tags: [rbac, roles, security]
role: [developer, admin, ops]

# Role Management

Role-based access control with builtin and custom roles.

## Overview

Roles define permission levels across the application. Three builtin roles exist by default (`user`, `admin`, `system`). Custom roles can be created via API. Users carry an array of roles, allowing multiple permission levels per user. Roles cascade-delete from tools and skills filesystem when removed.

**Base path:** `/api/roles`

## Builtin Roles

| Role | Description | Access Level |
|---|---|---|
| `user` | Default role for all authenticated users | Standard API access |
| `admin` | Administrators with full management access | Config, roles, user CRUD, settings reset |
| `system` | System-level operations | Internal service access |

Builtin roles are created automatically on server startup via `RoleService.ensureBuiltinRoles()`. They cannot be deleted.

## Role Model

```
+---------------------------+
| Role                      |
+---------------------------+
| _id        ObjectId       |
| name       String (uniq)  |
| desc       String         |
| is_built   Boolean        |
| created_at Date           |
| updated_at Date           |
+---------------------------+

Constraints:
- name: required, unique, trimmed, 2-50 chars, lowercase
- description: optional, trimmed, default ""
- is_builtin: auto-set by RoleService for builtin roles
```

## User Model Roles

The `User` model stores roles as an array field:

```javascript
roles: [String]  // e.g. ["user", "admin"]
```

This differs from a single `role` string — users can hold multiple roles simultaneously. The header component displays the first role via `user?.roles?.[0]`.

## API Endpoints

### List All Roles

```
GET /api/roles
Authorization: Bearer <token>
Role: admin required
```

**Response:** Sorted by `is_builtin` (custom first), then `name`.

```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "editor", "description": "Content editor", "is_builtin": false },
    { "_id": "...", "name": "admin", "description": "Built-in admin role", "is_builtin": true }
  ]
}
```

### Create Role

```
POST /api/roles
Authorization: Bearer <token>
Role: admin required
Content-Type: application/json
```

**Request body:**

```json
{ "name": "editor", "description": "Can edit content" }
```

- Name is normalized to lowercase and trimmed
- Cannot create a role with a builtin name (`user`, `admin`, `system`)
- Duplicate names return 409

**Response:** Created Role document (201).

### Delete Role

```
DELETE /api/roles/:name
Authorization: Bearer <token>
Role: admin required
```

Cannot delete builtin roles. On successful deletion, the role is cascade-removed from all tools and skills files.

**Response:** `{ "success": true }`

| Status | Condition |
|---|---|
| 400 | Built-in role name provided |
| 404 | Role not found |

## Role Hierarchy

```
          +---------+
          | system  |     Highest privilege level
          +----+----+
               |
    +----------+----------+
    |                     |
+---+---+           +-----+-----+
| admin |           |   user    |     Standard access levels
+-------+           +-----------+
```

- `system` — reserved for system-level operations and internal services
- `admin` — can manage config, roles, users, and reset settings
- `user` — default role assigned to all new users

## RBAC Middleware Flow

```
Request arrives
       |
       v
+-------------------+
| authMiddleware    |
| (verify JWT)      | --------> 401 if no token / invalid
+-------------------+
       | success
       v
+--------------------------+
| rbac.requireAdmin() or   |
| rbac.authorize(...)      |
+--------------------------+
       |
       | Check: req.user.roles array
       | contains required role(s)?
       |
    +--+--+
    |     |
   yes    no
    |     |
    v     v
  next()  403
          { success: false,
            error: "Insufficient permissions" }
```

### Middleware Functions

| Function | Description | Usage in Routes |
|---|---|---|
| `authorize(...roles)` | Check user has ANY of the listed roles | Flexible multi-role checks |
| `requireAdmin` | Check user has `"admin"` in roles | Config, Roles endpoints |
| `requireSystem` | Check user has `"system"` in roles | System-level endpoints |

### authorize() Details

```javascript
authorize('admin', 'editor')  // user needs at least one of these
```

- Accepts zero or more role strings
- Returns true if ANY role matches the user's `roles` array
- With zero args, always passes (just checks auth)

## Cascade Deletion

When a custom role is deleted, it is removed from:

1. **Tools** — `Tool.roles` array filter removes the role; if empty after removal, defaults to `["user"]`
2. **Skills** — Filesystem scan of `integrations/opencode/skills/<skill>/SKILL.md` frontmatter `roles` field; updates YAML frontmatter and writes back

```
DELETE /api/roles/:name
        |
        v
+-------------------+
| Remove from Tool  |
| model (DB)        | --------> Default to ["user"] if empty
+-------------------+
        |
        v
+-------------------------+
| Scan skills directory   |
| Update SKILL.md         | --------> Rewrite frontmatter YAML
| frontmatter roles       |
+-------------------------+
```

## RoleService Functions

| Function | Description | Called |
|---|---|---|
| `ensureBuiltinRoles()` | Creates user/admin/system if missing | Server startup |
| `getAllRoles()` | Fetch all roles sorted | GET /api/roles |
| `getRoleByName(name)` | Find single role by name | Internal use |
| `createRole(name, desc)` | Create new custom role | POST /api/roles |
| `deleteRole(name)` | Delete with cascade cleanup | DELETE /api/roles/:name |
| `isValidRole(roleName)` | Check if role exists or is builtin | Validation |

## Related Pages

- [Auth Middleware](../architecture/authentication.md) — JWT authentication flow
- [User Management](./user-management.md) — User CRUD and role assignment
- [Config Management](./config-management.md) — Admin-only config endpoints
