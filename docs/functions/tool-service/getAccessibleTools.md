tags: [tools, custom-tools, rbac]
role: backend-developer

# getAccessibleTools(userRoles)

Returns all tools whose `roles` array intersects with the user's roles.

**Parameters:** `userRoles` — array of role strings (e.g. `['admin', 'user']`).

**Query:** Finds Tool documents where `roles: { $in: userRoles }`, sorted by `created_at` descending.

**Returns:** `{ success: true, data: [...] }`.

---
[Back to Tool Service Functions](./tool-service-functions.md)
