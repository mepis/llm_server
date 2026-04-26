tags: [skills, deletion]
role: backend-developer

# deleteSkill(name)

Removes an entire skill directory recursively.

**Parameters:** `name` — skill name (same fuzzy matching as updateSkill).

**Process:** Same three-candidate directory search as `updateSkill()`. Uses `fs.rmSync(skillDir, { recursive: true, force: true })` to remove the directory and all contents.

**Returns:** `{ success: true }`.

**Throws:** `Error('Skill not found: <name>')` if no candidate path exists.

---
[Back to Skill Service Functions](./skill-service-functions.md)
