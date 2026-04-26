tags: [skills, file-structure]
role: backend-developer

# Skill File Structure and Discovery Flow

Each skill is stored as a Markdown file with YAML frontmatter.

## File Structure

```yaml
---
name: document-parser
description: "Parses various file formats for RAG indexing"
roles: ["admin", "user"]
tools: [bash, read]
model: llama-3-8b
---

You are a technical writer creating comprehensive documentation...

Detailed instructions and workflows follow here...
```

The frontmatter fields (`name`, `description`, `roles`, `tools`, `model`) are parsed by `gray-matter`. Everything after the closing `---` is the skill content (body).

## Discovery and Caching Flow

```
  ┌──────────────────────────────────────────────┐
  │           Skill Service Architecture         │
  └──────────────────────────────────────────────┘

  File System                    Memory
  ┌─────────────────┐          ┌─────────────────┐
  │ integrations/   │          │                 │
  │   opencode/     │          │ _cachedSkills   │
  │     skills/     │          │ _cacheTimestamp │
  │       ├── doc-  │◄──reads──│                 │
  │       │  parser │          │                 │
  │       │  SKILL.md│          └────────┬────────┘
  │       ├── code-  │                  │ TTL check
  │       │  reviewer│              expire? → rediscover
  │       │  SKILL.md│
  │       └── ...    │
  └─────────────────┘

  invalidate on: createSkill(), updateSkill(), deleteSkill()
```

---
[Back to Index](../index.md)
