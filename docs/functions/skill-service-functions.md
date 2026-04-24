tags: [skills, discovery, caching, file-system]
role: backend-developer

# Skill Service Functions

Documented from `src/services/skillService.js`. The skill service manages discoverable skills — YAML-frontmattered markdown files stored in the `integrations/opencode/skills/` directory. Skills provide specialized instructions and workflows for specific tasks.

## discoverSkills()

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

## getCachedSkills()

Returns cached skills with a 30-second TTL cache. Cache is invalidated (`_cachedSkills = null`) on skill create, update, or delete operations.

**Cache lifecycle:**

```
  getCachedSkills() called
        │
  Cached data exists? ── YES
  Age < 30 seconds? ──── YES ──→ return cached copy
        │ NO
        ▼
  Call discoverSkills()
        │
  Store in _cachedSkills
  Set _cacheTimestamp = Date.now()
        │
  Return fresh data
```

## parseSkill(filePath)

Parses a single SKILL.md file from a given file path.

**Parameters:** `filePath` — absolute path to a SKILL.md file.

**Returns:** Same skill object structure as `discoverSkills()` entries.

**Validation:** Throws `Error('Skill missing required frontmatter fields (name, description)')` if frontmatter lacks `name` or `description`.

## getSkillByName(name)

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

## getAccessibleSkills(userRoles)

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

## getSkillDirs()

Returns an array of absolute paths to all skill subdirectories under `SKILLS_DIR`, regardless of whether they contain a valid SKILL.md file.

**Returns:** Array of directory path strings. Returns empty array if skills directory does not exist.

## createSkill(data)

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

## updateSkill(name, data)

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

## deleteSkill(name)

Removes an entire skill directory recursively.

**Parameters:** `name` — skill name (same fuzzy matching as updateSkill).

**Process:** Same three-candidate directory search as `updateSkill()`. Uses `fs.rmSync(skillDir, { recursive: true, force: true })` to remove the directory and all contents.

**Returns:** `{ success: true }`.

**Throws:** `Error('Skill not found: <name>')` if no candidate path exists.

## Skill File Structure

Each skill is stored as a Markdown file with YAML frontmatter:

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

The frontmatter fields (`name`, `description`, `roles`, `tools`, `model`) are parsed by `gray-matter`. Everything after the closing `---` is the skill content (body), which contains the actual instructions.

## Skill Discovery and Caching Flow

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
  │       │  parser │          └────────┬────────┘
  │       │  SKILL.md│                  │ TTL check
  │       ├── code-  │                   │
  │       │  reviewer│              expire? → rediscover
  │       │  SKILL.md│
  │       └── ...    │
  └─────────────────┘

  invalidate on: createSkill(), updateSkill(), deleteSkill()
```
