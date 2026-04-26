tags: [skills, discovery]
role: backend-developer

# getSkillByName(name)

Finds a skill by name with fuzzy matching across three sanitization strategies.

**Parameters:** `name` — the skill name to search for.

**Sanitization strategies applied to input:**

| Strategy | Regex | Example |
|----------|-------|---------|
| Default | exact match | `"document-parser"` |
| Hyphen→underscore | `/[^a-z0-9_-]/gi → '_'` | `"doc_parser"` |
| Non-alphanumeric | `/[^a-z0-9_]/g → '_'` | `"docparser"` |
| Non-hyphen | `/[^a-z0-9-]/g → '_'` | `"doc-parser"` |

**Returns:** `{ success: true, data: skill }`.

**Throws:** `Error('Skill not found: <name>')` if no match is found across any sanitization strategy.

---
[Back to Skill Service Functions](./skill-service-functions.md)
