tags: [skills, rbac]
role: backend-developer

# getAccessibleSkills(userRoles)

Filters skills by role access control. Admin and system users see all skills; regular users only see skills matching their roles.

**Parameters:** `userRoles` — array of user role strings.

**Logic:**

```
  For each skill:
    ┌───────────────────────────────┐
    │ User is admin or system?      │
    │   YES → include (all visible) │
    │   NO  → check skill.roles     │
    │         intersects userRoles? │
    │           YES → include       │
    │           NO  → exclude       │
    └───────────────┬───────────────┘
```

**Returns:** `{ success: true, data: accessibleSkills[] }`.

---
[Back to Skill Service Functions](./skill-service-functions.md)
