const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const registerUser = async (username, email, password) => {
    try {
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });
      
      if (existingUser) {
        throw new Error('Username or email already exists');
      }
      
      const passwordHash = await User.hashPassword(password);
      
      const user = await User.create({
        username,
        email,
        password_hash: passwordHash,
        roles: ['user']
      });
      
      logger.info(`User registered: ${user.username} (${user.email})`);
      
      return {
        success: true,
        data: {
          user_id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles
        }
      };
    } catch (error) {
      logger.error('User registration failed:', error.message);
      throw error;
    }
  };

 const createUser = async ({ username, email, password, roles = ['user'], isActive = true }) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const validRoles = ['user', 'admin', 'system'];
    for (const role of roles) {
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      username,
      email,
      password_hash: passwordHash,
      roles,
      is_active: isActive
    });

    logger.info(`Admin created user: ${user.username} (${user.email})`);

    return {
      success: true,
      data: user
    };
  } catch (error) {
    logger.error('Create user failed:', error.message);
    throw error;
  }
};

const loginUser = async (username, password) => {
    try {
      const user = await User.findOne({ username });
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const isValidPassword = await user.checkPassword(password);
      
      logger.debug(`Password verification for ${username}: ${isValidPassword}`);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
    
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }
    
    user.last_login = new Date();
    await user.save();
    
    const token = generateToken(user._id, user.username, user.roles);
    
    logger.info(`User logged in: ${user.username}`);
    
    return {
      success: true,
      data: {
        token,
        user: {
          user_id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles,
          preferences: user.preferences
        }
      }
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
    const user = await User.findById(userId).select('-password_hash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    logger.error('Get user failed:', error.message);
    throw error;
  }
};

const updateUser = async (userId, updateData) => {
  try {
    const allowedUpdates = ['email', 'preferences', 'is_active'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    }
    
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-password_hash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`User updated: ${userId}`);
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    logger.error('Update user failed:', error.message);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);
    
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
    const validRoles = ['user', 'admin', 'system'];
    
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: role } },
      { new: true }
    ).select('-password_hash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`User role updated: ${userId} - ${role}`);
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    logger.error('Set user role failed:', error.message);
    throw error;
  }
};

const removeUserRole = async (userId, role) => {
  try {
    const validRoles = ['user', 'admin', 'system'];
    
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { roles: role } },
      { new: true }
    ).select('-password_hash');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    logger.info(`User role removed: ${userId} - ${role}`);
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    logger.error('Remove user role failed:', error.message);
    throw error;
  }
};

const updateUserPassword = async (userId, newPassword) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await user.resetPassword(newPassword);
    
    logger.info(`Admin reset password for user: ${user.username}`);
    
    return {
      success: true,
      data: { username: user.username, email: user.email }
    };
  } catch (error) {
    logger.error('Update user password failed:', error.message);
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
  updateUserPassword
};
