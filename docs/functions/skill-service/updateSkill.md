tags: [skills, update]
role: backend-developer

# updateSkill(name, data)

Updates an existing skill by finding its directory through multiple candidate paths and merging updates.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| name | String | Skill name (uses same fuzzy matching as getSkillByName) |
| data | Object | Fields to update (same shape as createSkill params) |

**Directory search:** Tries three candidate paths using the same sanitization strategies as `getSkillByName`:

```
  Candidate 1: name → /[^a-z0-9_-]/gi → '_'
  Candidate 2: name → /[^a-z0-9_]/g → '_'
  Candidate 3: name → /[^a-z0-9-]/g → '_'
```

**Process:** Finds first existing SKILL.md among candidates, parses it with `parseSkill()`, merges `data` over the existing skill data (using `Object.assign`), writes updated file, invalidates cache.

**Returns:** `{ success: true, data: skill }` — the updated skill.

**Throws:** `Error('Skill not found: <name>')` if no candidate path has an existing SKILL.md.

---
[Back to Skill Service Functions](./skill-service-functions.md)
