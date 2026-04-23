const Role = require('../models/Role');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Tool = require('../models/Tool');
const logger = require('../utils/logger');

const SKILLS_DIR = path.join(__dirname, '../../integrations/opencode/skills');

const BUILTIN_ROLES = ['user', 'admin', 'system'];

const ensureBuiltinRoles = async () => {
  try {
    for (const roleName of BUILTIN_ROLES) {
      const existing = await Role.findOne({ name: roleName });
      if (!existing) {
        await Role.create({ name: roleName, description: `Built-in ${roleName} role`, is_builtin: true });
        logger.info(`Created builtin role: ${roleName}`);
      }
    }
  } catch (error) {
    logger.error('Failed to ensure builtin roles:', error.message);
  }
};

const getAllRoles = async () => {
  try {
    const roles = await Role.find().sort({ is_builtin: 1, name: 1 });
    return {
      success: true,
      data: roles
    };
  } catch (error) {
    logger.error('Get all roles failed:', error.message);
    throw error;
  }
};

const getRoleByName = async (name) => {
  try {
    const role = await Role.findOne({ name });
    if (!role) {
      return null;
    }
    return {
      success: true,
      data: role
    };
  } catch (error) {
    logger.error('Get role by name failed:', error.message);
    throw error;
  }
};

const createRole = async (name, description) => {
  try {
    const normalizedName = name.trim().toLowerCase();

    if (BUILTIN_ROLES.includes(normalizedName)) {
      throw new Error('Cannot create a role with a built-in role name');
    }

    const existing = await Role.findOne({ name: normalizedName });
    if (existing) {
      throw new Error('Role already exists');
    }

    const role = await Role.create({
      name: normalizedName,
      description: description?.trim() || ''
    });

    logger.info(`Role created: ${role.name}`);

    return {
      success: true,
      data: role
    };
  } catch (error) {
    logger.error('Create role failed:', error.message);
    throw error;
  }
};

const deleteRole = async (name) => {
  try {
    const normalizedName = name.trim().toLowerCase();

    if (BUILTIN_ROLES.includes(normalizedName)) {
      throw new Error('Cannot delete built-in roles');
    }

    const role = await Role.findOneAndDelete({ name: normalizedName });

    if (!role) {
      throw new Error('Role not found');
    }

    logger.info(`Role deleted: ${role.name}`);

    await cascadeRemoveRoleFromTools(normalizedName);
    await cascadeRemoveRoleFromSkills(normalizedName);

    return { success: true };
  } catch (error) {
    logger.error('Delete role failed:', error.message);
    throw error;
  }
};

const cascadeRemoveRoleFromTools = async (roleName) => {
  try {
    const tools = await Tool.find({ roles: roleName });
    for (const tool of tools) {
      tool.roles = tool.roles.filter(r => r !== roleName);
      if (tool.roles.length === 0) {
        tool.roles = ['user'];
      }
      await tool.save();
    }
    logger.info(`Removed role "${roleName}" from ${tools.length} tools`);
  } catch (error) {
    logger.error('Cascade remove role from tools failed:', error.message);
  }
};

const cascadeRemoveRoleFromSkills = async (roleName) => {
  try {
    if (!fs.existsSync(SKILLS_DIR)) return;

    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillFile = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;

      try {
        const content = fs.readFileSync(skillFile, 'utf-8');
        const { data, content: body } = matter(content);

        if (data.roles && Array.isArray(data.roles)) {
          const updatedRoles = data.roles.filter(r => r !== roleName);
          if (updatedRoles.length === 0) {
            data.roles = ['user'];
          } else {
            data.roles = updatedRoles;
          }

          const frontmatter = `---
name: ${data.name}
description: "${(data.description || '').replace(/"/g, '\\"')}"
${data.roles ? `roles: [${data.roles.map(r => `"${r}"`).join(', ')}]
` : ''}${data.tools ? `tools: ${data.tools}
` : ''}${data.model ? `model: ${data.model}
` : ''}---

`;

          fs.writeFileSync(skillFile, frontmatter + body.trim(), 'utf-8');
        }
      } catch (skillError) {
        logger.error(`Failed to update skill ${entry.name}:`, skillError.message);
      }
    }

    logger.info(`Removed role "${roleName}" from skills`);
  } catch (error) {
    logger.error('Cascade remove role from skills failed:', error.message);
  }
};

const isValidRole = async (roleName) => {
  try {
    const normalizedName = roleName.trim().toLowerCase();
    if (BUILTIN_ROLES.includes(normalizedName)) {
      return true;
    }
    const role = await Role.findOne({ name: normalizedName });
    return !!role;
  } catch (error) {
    logger.error('Validate role failed:', error.message);
    return false;
  }
};

module.exports = {
  ensureBuiltinRoles,
  getAllRoles,
  getRoleByName,
  createRole,
  deleteRole,
  isValidRole,
  BUILTIN_ROLES
};
