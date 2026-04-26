tags: [skills, parsing]
role: backend-developer

# parseSkill(filePath)

Parses a single SKILL.md file from a given file path.

**Parameters:** `filePath` — absolute path to a SKILL.md file.

**Returns:** Same skill object structure as `discoverSkills()` entries.

**Validation:** Throws `Error('Skill missing required frontmatter fields (name, description)')` if frontmatter lacks `name` or `description`.

---
[Back to Skill Service Functions](./skill-service-functions.md)
