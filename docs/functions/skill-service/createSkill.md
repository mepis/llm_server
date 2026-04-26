tags: [skills, creation]
role: backend-developer

# createSkill(data)

Creates a new skill by writing a SKILL.md file in a new subdirectory.

**Parameters:** `data` — object with fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Skill name (sanitized to `[a-z0-9_-]+`) |
| `description` | String | Yes | Human-readable description |
| `content` | String | No | Markdown body content |
| `roles` | Array | No | Access roles, defaults not set |
| `tools` | Array | No | Skill tools |
| `model` | String | No | Model specification |

**Process:**

```
  createSkill(data)
        │
  Validate name + description present ── NO ──→ throw Error
        │ YES
        ▼
  Sanitize name: /[^a-z0-9_-]/gi → '_'
        │
  Create directory: SKILLS_DIR/<sanitizedName>/
        │
  Build frontmatter YAML:
    ---
    name: <sanitized>
    description: "<escaped>"
    [roles: ...]
    [tools: ...]
    [model: ...]
    ---

    <content body>
        │
  Write to SKILLS_DIR/<sanitizedName>/SKILL.md
        │
  Invalidate cache (_cachedSkills = null)
        │
  Return getSkillByName(sanitizedName)
```

**Returns:** `{ success: true, data: skill }` from `getSkillByName()`.

---
[Back to Skill Service Functions](./skill-service-functions.md)
