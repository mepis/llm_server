const { getDB } = require('../config/db');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const logger = require('../utils/logger');

const knex = () => getDB();

const SKILLS_DIR = path.join(__dirname, '../../integrations/opencode/skills');

const BUILTIN_ROLES = ['user', 'admin', 'system'];

const ensureBuiltinRoles = async () => {
  try {
    for (const roleName of BUILTIN_ROLES) {
      const existing = await knex().from('roles').where({ name: roleName }).first();
      if (!existing) {
        const id = require('uuid').v4();
        await knex().insert({
          id,
          name: roleName,
          description: `Built-in ${roleName} role`,
          is_builtin: true,
        }).into('roles');
        logger.info(`Created builtin role: ${roleName}`);
      }
    }
  } catch (error) {
    logger.error('Failed to ensure builtin roles:', error.message);
  }
};

const getAllRoles = async () => {
  try {
    const roles = await knex().from('roles').orderByRaw('is_builtin ASC, name ASC');
    return { success: true, data: roles };
  } catch (error) {
    logger.error('Get all roles failed:', error.message);
    throw error;
  }
};

const getRoleByName = async (name) => {
  try {
    const role = await knex().from('roles').where({ name }).first();
    if (!role) return null;
    return { success: true, data: role };
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

    const existing = await knex().from('roles').where({ name: normalizedName }).first();
    if (existing) {
      throw new Error('Role already exists');
    }

    const id = require('uuid').v4();
    await knex().insert({
      id,
      name: normalizedName,
      description: description?.trim() || '',
    }).into('roles');

    const insertedRole = await knex().from('roles').where({ id }).first();
    logger.info(`Role created: ${insertedRole?.name}`);

    return { success: true, data: insertedRole };
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

    const existing = await knex().from('roles').where({ name: normalizedName }).first();
    if (!existing) {
      throw new Error('Role not found');
    }
    await knex().from('roles').where({ name: normalizedName }).del();

    logger.info(`Role deleted: ${normalizedName}`);

    await cascadeRemoveRoleFromTools(normalizedName);
    await cascadeRemoveRoleFromSkills(normalizedName);
    await cascadeRemoveRoleFromGroups(normalizedName);

    return { success: true };
  } catch (error) {
    logger.error('Delete role failed:', error.message);
    throw error;
  }
};

const cascadeRemoveRoleFromTools = async (roleName) => {
  try {
    const tools = await knex().from('tools');
    for (const tool of tools) {
      const roles = typeof tool.roles === 'string' ? JSON.parse(tool.roles) : (tool.roles || []);
      const newRoles = roles.filter(r => r !== roleName);
      if (newRoles.length === 0) {
        newRoles.push('user');
      }
      await knex().from('tools').where({ id: tool.id }).update({ roles: JSON.stringify(newRoles) });
    }
    logger.info(`Removed role "${roleName}" from tools`);
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

const cascadeRemoveRoleFromGroups = async (roleName) => {
  try {
    const groups = await knex().from('document_groups');
    for (const group of groups) {
      const roles = typeof group.roles === 'string' ? JSON.parse(group.roles) : (group.roles || []);
      const newRoles = roles.filter(r => r !== roleName);
      if (newRoles.length === 0) {
        newRoles.push('user');
      }
      await knex().from('document_groups')
        .where({ id: group.id })
        .update({ roles: JSON.stringify(newRoles) });
    }
    logger.info(`Removed role "${roleName}" from document groups`);
  } catch (error) {
    logger.error('Cascade remove role from groups failed:', error.message);
  }
};

const isValidRole = async (roleName) => {
  try {
    const normalizedName = roleName.trim().toLowerCase();
    if (BUILTIN_ROLES.includes(normalizedName)) {
      return true;
    }
    const role = await knex().from('roles').where({ name: normalizedName }).first();
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
  BUILTIN_ROLES,
};
