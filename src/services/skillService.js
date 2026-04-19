const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const logger = require('../utils/logger');

const SKILLS_DIR = path.join(__dirname, '../../integrations/opencode/skills');

function discoverSkills() {
  const skills = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    logger.warn(`Skills directory not found: ${SKILLS_DIR}`);
    return skills;
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(SKILLS_DIR, entry.name);
    const skillFile = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillFile)) continue;

    try {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const { data, content: body } = matter(content);

      if (!data.name || !data.description) {
        logger.warn(`Skill at ${skillFile} missing required frontmatter fields (name, description)`);
        continue;
      }

      skills.push({
        name: data.name,
        description: data.description,
        location: `file://${skillFile}`,
        content: body.trim(),
        roles: data.roles || ['user'],
        tools: data.tools || null,
        model: data.model || null,
      });
    } catch (error) {
      logger.error(`Failed to parse skill ${skillFile}: ${error.message}`);
    }
  }

  return skills;
}

let _cachedSkills = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 30000;

function getCachedSkills() {
  const now = Date.now();
  if (_cachedSkills && (now - _cacheTimestamp) < CACHE_TTL) {
    return _cachedSkills;
  }
  _cachedSkills = discoverSkills();
  _cacheTimestamp = now;
  return _cachedSkills;
}

function parseSkill(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  if (!data.name || !data.description) {
    throw new Error('Skill missing required frontmatter fields (name, description)');
  }

  return {
    name: data.name,
    description: data.description,
    location: `file://${filePath}`,
    content: body.trim(),
    roles: data.roles || ['user'],
    tools: data.tools || null,
    model: data.model || null,
  };
}

async function getSkillByName(name) {
  const skills = getCachedSkills();
  const skill = skills.find((s) => s.name === name);

  if (!skill) {
    throw new Error(`Skill not found: ${name}`);
  }

  return {
    success: true,
    data: skill,
  };
}

async function getAccessibleSkills(userRoles) {
  const allSkills = getCachedSkills();
  const accessible = allSkills.filter((skill) => {
    const skillRoles = skill.roles || ['user'];
    if (userRoles.includes('admin') || userRoles.includes('system')) {
      return true;
    }
    return skillRoles.some((role) => userRoles.includes(role));
  });

  return {
    success: true,
    data: accessible,
  };
}

async function getSkillDirs() {
  const dirs = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    return dirs;
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(path.join(SKILLS_DIR, entry.name));
    }
  }

  return dirs;
}

async function createSkill(data) {
  const { name, description, content, roles, tools, model } = data;

  if (!name || !description) {
    throw new Error('Name and description are required');
  }

  const skillDir = path.join(SKILLS_DIR, name.replace(/[^a-z0-9_-]/gi, '_'));

  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  const frontmatter = `---
name: ${name}
description: "${description.replace(/"/g, '\\"')}"
${roles ? `roles: [${roles.map((r) => `"${r}"`).join(', ')}]
` : ''}${tools ? `tools: ${tools}
` : ''}${model ? `model: ${model}
` : ''}---

`;

  const skillFile = path.join(skillDir, 'SKILL.md');
  fs.writeFileSync(skillFile, frontmatter + content, 'utf-8');

  _cachedSkills = null;

  logger.info(`Skill created: ${name}`);

  return getSkillByName(name);
}

async function updateSkill(name, data) {
  const skillDir = path.join(SKILLS_DIR, name.replace(/[^a-z0-9_-]/gi, '_'));
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    throw new Error(`Skill not found: ${name}`);
  }

  const existing = parseSkill(skillFile);
  const updated = {
    ...existing,
    ...data,
  };

  const frontmatter = `---
name: ${updated.name}
description: "${updated.description.replace(/"/g, '\\"')}"
${updated.roles ? `roles: [${updated.roles.map((r) => `"${r}"`).join(', ')}]
` : ''}${updated.tools ? `tools: ${updated.tools}
` : ''}${updated.model ? `model: ${updated.model}
` : ''}---

`;

  fs.writeFileSync(skillFile, frontmatter + updated.content, 'utf-8');
  _cachedSkills = null;

  logger.info(`Skill updated: ${name}`);

  return getSkillByName(name);
}

async function deleteSkill(name) {
  const skillDir = path.join(SKILLS_DIR, name.replace(/[^a-z0-9_-]/gi, '_'));
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    throw new Error(`Skill not found: ${name}`);
  }

  fs.rmSync(skillDir, { recursive: true, force: true });
  _cachedSkills = null;

  logger.info(`Skill deleted: ${name}`);

  return { success: true };
}

module.exports = {
  discoverSkills,
  parseSkill,
  getSkillByName,
  getAccessibleSkills,
  getSkillDirs,
  createSkill,
  updateSkill,
  deleteSkill,
};
