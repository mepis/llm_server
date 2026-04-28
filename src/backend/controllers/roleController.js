const roleService = require('../services/roleService');
const logger = require('../utils/logger');

const getAllRoles = async (req, res) => {
  try {
    const result = await roleService.getAllRoles();
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get all roles failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Role name is required' });
    const result = await roleService.createRole(name, description);
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Create role failed:', error.message);
    res.status(error.message.includes('already exists') ? 409 : 400).json({ success: false, error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    await roleService.deleteRole(req.params.name);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete role failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { getAllRoles, createRole, deleteRole };
