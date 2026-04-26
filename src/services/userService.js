const knex = require('../config/db').getDB;
const { v4: uuidv4 } = require('uuid');
const zod = require('zod');
const roleService = require('../services/roleService');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const userUpdateSchema = zod.object({
  email: zod.string().email().max(255).optional(),
  display_name: zod.string().max(100).optional(),
  matrix_username: zod.string().max(100).optional(),
  preferences: zod.record(zod.string(), zod.any()).optional(),
  is_active: zod.boolean().optional(),
});

const updateUserRolesArray = async (db, userId, rolesFn) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) return null;
  const newRoles = rolesFn(user.roles || ['user']);
  return db('users').where({ id: userId }).update({ roles: JSON.stringify(newRoles) }).returning('*');
};

const registerUser = async (username, email, password) => {
  try {
    const existingUser = await knex()('users').whereRaw(
      'JSON_CONTACT(username, ?) OR JSON_CONTACT(email, ?)',
      [username, email]
    ).first();

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const passwordHash = await require('node-argon2').hash(password);
    const id = uuidv4();

    const [user] = await knex()('users').insert({
      id,
      username,
      email,
      password_hash: passwordHash,
      roles: JSON.stringify(['user']),
    }).returning('*');

    logger.info(`User registered: ${user.username} (${user.email})`);

    return {
      success: true,
      data: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || ['user'],
      },
    };
  } catch (error) {
    logger.error('User registration failed:', error.message);
    throw error;
  }
};

const createUser = async ({ username, email, password, roles = ['user'], isActive = true }) => {
  try {
    const existingUser = await knex()('users').whereRaw(
      'JSON_CONTACT(username, ?) OR JSON_CONTACT(email, ?)',
      [username, email]
    ).first();

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    for (const role of roles) {
      const valid = await roleService.isValidRole(role);
      if (!valid) {
        throw new Error(`Invalid role: ${role}`);
      }
    }

    const passwordHash = await require('node-argon2').hash(password);
    const id = uuidv4();

    const [user] = await knex()('users').insert({
      id,
      username,
      email,
      password_hash: passwordHash,
      roles: JSON.stringify(roles),
      is_active: isActive,
    }).returning('*');

    logger.info(`Admin created user: ${user.username} (${user.email})`);

    return { success: true, data: user };
  } catch (error) {
    logger.error('Create user failed:', error.message);
    throw error;
  }
};

const loginUser = async (username, password) => {
  try {
    const user = await knex()('users').where({ username }).first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await require('node-argon2').verify({ hash: user.password_hash, password });

    logger.debug(`Password verification for ${username}: ${isValidPassword}`);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    await knex()('users').where({ id: user.id }).update({ last_login: new Date() });

    const token = generateToken(user.id, user.username, user.roles || ['user']);

    logger.info(`User logged in: ${user.username}`);

    return {
      success: true,
      data: {
        token,
        user: {
          user_id: user.id,
          username: user.username,
          display_name: user.display_name,
          matrix_username: user.matrix_username,
          email: user.email,
          roles: user.roles || ['user'],
          preferences: user.preferences || {},
        },
      },
    };
  } catch (error) {
    logger.error('Login failed:', error.message);
    throw error;
  }
};

const logoutUser = async (userId) => {
  try {
    logger.info(`User logged out: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Logout failed:', error.message);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const user = await knex()('users').where({ id: userId }).first();

    if (!user) {
      throw new Error('User not found');
    }

    return { success: true, data: user };
  } catch (error) {
    logger.error('Get user failed:', error.message);
    throw error;
  }
};

const updateUser = async (userId, updateData) => {
  try {
    const parsed = userUpdateSchema.parse(updateData);

    const allowedUpdates = ['email', 'display_name', 'matrix_username', 'preferences', 'is_active'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (parsed[key] !== undefined) {
        if (typeof parsed[key] === 'object') {
          updates[key] = JSON.stringify(parsed[key]);
        } else {
          updates[key] = parsed[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      const user = await knex()('users').where({ id: userId }).first();
      return { success: true, data: user };
    }

    updates.updated_at = new Date();
    const [user] = await knex()('users').where({ id: userId }).update(updates).returning('*');

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User updated: ${userId}`);

    return { success: true, data: user };
  } catch (error) {
    if (error instanceof zod.ZodError) {
      const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      logger.error('Update user validation failed:', details);
      const validationErr = new Error(`Validation failed: ${details}`);
      validationErr.status = 400;
      throw validationErr;
    }
    logger.error('Update user failed:', error.message);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    const [user] = await knex()('users').where({ id: userId }).del().returning('*');

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User deleted: ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete user failed:', error.message);
    throw error;
  }
};

const setUserRole = async (userId, role) => {
  try {
    const valid = await roleService.isValidRole(role);
    if (!valid) {
      throw new Error(`Invalid role: ${role}`);
    }

    const [user] = await updateUserRolesArray(knex(), userId, (roles) => {
      if (!roles.includes(role)) {
        roles.push(role);
      }
      return roles;
    }).returning('*');

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User role updated: ${userId} - ${role}`);

    return { success: true, data: user };
  } catch (error) {
    logger.error('Set user role failed:', error.message);
    throw error;
  }
};

const removeUserRole = async (userId, role) => {
  try {
    const valid = await roleService.isValidRole(role);
    if (!valid) {
      throw new Error(`Invalid role: ${role}`);
    }

    const [user] = await updateUserRolesArray(knex(), userId, (roles) => {
      return roles.filter(r => r !== role);
    }).returning('*');

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User role removed: ${userId} - ${role}`);

    return { success: true, data: user };
  } catch (error) {
    logger.error('Remove user role failed:', error.message);
    throw error;
  }
};

const updateUserPassword = async (userId, newPassword) => {
  try {
    const user = await knex()('users').where({ id: userId }).first();

    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await require('node-argon2').hash(newPassword);
    await knex()('users').where({ id: userId }).update({ password_hash: passwordHash });

    logger.info(`Admin reset password for user: ${user.username}`);

    return {
      success: true,
      data: { username: user.username, email: user.email },
    };
  } catch (error) {
    logger.error('Update user password failed:', error.message);
    throw error;
  }
};

const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await knex()('users').where({ id: userId }).first();

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await require('node-argon2').verify({ hash: user.password_hash, password: currentPassword });
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await require('node-argon2').hash(newPassword);
    await knex()('users').where({ id: userId }).update({ password_hash: passwordHash });

    logger.info(`User changed password: ${user.username}`);

    return {
      success: true,
      data: { username: user.username, email: user.email },
    };
  } catch (error) {
    logger.error('Change password failed:', error.message);
    throw error;
  }
};

module.exports = {
  registerUser,
  createUser,
  loginUser,
  logoutUser,
  getUserById,
  updateUser,
  deleteUser,
  setUserRole,
  removeUserRole,
  updateUserPassword,
  changePassword,
};
