const Tool = require('../models/Tool');
const toolService = require('../services/toolService');
const logger = require('../utils/logger');

const createTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, description, parameters, function_code, is_active, roles } = req.body;

    if (!name || !description || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and parameters are required',
      });
    }

    const result = await toolService.createTool(userId, name, description, parameters, function_code, is_active, roles);

    res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Create tool failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getAccessibleTools = async (req, res) => {
  try {
    const userRoles = req.user.roles || ['user'];

    const result = await toolService.getAccessibleTools(userRoles);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get accessible tools failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getTool = async (req, res) => {
  try {
    const userRoles = req.user.roles || ['user'];
    const toolId = req.params.toolId;

    const result = await toolService.getTool(toolId, userRoles);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get tool failed:', error.message);
    if (error.message.includes('access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

const updateTool = async (req, res) => {
  try {
    const toolId = req.params.toolId;
    const updateData = req.body;

    const result = await toolService.updateTool(toolId, updateData);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Update tool failed:', error.message);
    if (error.message === 'Tool not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteTool = async (req, res) => {
  try {
    const toolId = req.params.toolId;

    await toolService.deleteTool(toolId);

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete tool failed:', error.message);
    if (error.message === 'Tool not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const callTool = async (req, res) => {
  try {
    const userRoles = req.user.roles || ['user'];
    const toolId = req.params.toolId;
    const input = req.body;

    const result = await toolService.callTool(toolId, userRoles, input);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Call tool failed:', error.message);
    if (error.message.includes('access denied')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createTool,
  getAccessibleTools,
  getTool,
  updateTool,
  deleteTool,
  callTool,
};
