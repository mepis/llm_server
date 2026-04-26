tags: [skills, discovery]
role: backend-developer

# discoverSkills()

Scans the skills directory for subdirectories containing a `SKILL.md` file, parses YAML frontmatter using `gray-matter`, and returns an array of skill objects.

**Process:**

```
  discoverSkills()
        │
  SKILLS_DIR exists? ── NO ──→ return [] (with warning log)
        │ YES
        ▼
  Read directory entries
        │
  For each entry:
    Is directory? ── NO ──→ skip
        │ YES
        ▼
  Check for SKILL.md in subdirectory ── MISSING ──→ skip
        │ EXISTS
        ▼
  Read file, parse with gray-matter
        │
  Has name + description frontmatter? ── NO ──→ warn & skip
        │ YES
        ▼
  Build skill object:
    { name, description, location, content,
      roles, tools, model }
        │
  Collect all skills → return array
```

**Returns:** Array of skill objects. Each has:

| Field | Type | Source |
|-------|------|--------|
| `name` | String | Frontmatter `name` |
| `description` | String | Frontmatter `description` |
| `location` | String | `file://` URI to SKILL.md |
| `content` | String | Markdown body (trimmed) |
| `roles` | Array | Frontmatter `roles`, defaults `['user']` |
| `tools` | Array/null | Frontmatter `tools` |
| `model` | String/null | Frontmatter `model` |

---
[Back to Skill Service Functions](./skill-service-functions.md)
