const userService = require('../services/userService');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const result = await userService.registerUser(username, email, password);
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Register failed:', error.message);
    res.status(error.message.includes('already exists') ? 409 : 400).json({
      success: false,
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, roles, is_active } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    const result = await userService.createUser({
      username,
      email,
      password,
      roles: roles || ['user'],
      isActive: is_active !== undefined ? is_active : true
    });
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create user failed:', error.message);
    res.status(error.message.includes('already exists') ? 409 : 400).json({
      success: false,
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await userService.loginUser(username, password);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Login failed:', error.message);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    await userService.logoutUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Logout failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await userService.getUserById(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get profile failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updateData = req.body;
    
    const result = await userService.updateUser(userId, updateData);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update profile failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    await userService.deleteUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete profile failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await require('../models/User')
      .find()
      .select('-password_hash')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get all users failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await userService.getUserById(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get user by ID failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;
    
    const result = await userService.updateUser(userId, updateData);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update user failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    await userService.deleteUser(userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete user failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role, removeRole } = req.body;
    
    let result;
    if (removeRole) {
      result = await require('../services/userService').removeUserRole(userId, removeRole);
    } else if (role) {
      result = await require('../services/userService').setUserRole(userId, role);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either "role" or "removeRole" must be provided'
      });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update user role failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    const result = await userService.updateUserPassword(userId, password);

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Reset user password failed:', error.message);
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  register,
  createUser,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  resetUserPassword
};
