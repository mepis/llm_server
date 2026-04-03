const toolService = require('../services/toolService');
const logger = require('../utils/logger');

const createTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, description, parameters, function_code, is_active } = req.body;
    
    if (!name || !description || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and parameters are required'
      });
    }
    
    const result = await toolService.createTool(userId, name, description, parameters, function_code, is_active);
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Create tool failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getUserTools = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await toolService.getUserTools(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get user tools failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const toolId = req.params.toolId;
    
    const result = await toolService.getTool(toolId, userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get tool failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const toolId = req.params.toolId;
    const updateData = req.body;
    
    const result = await toolService.updateTool(toolId, userId, updateData);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update tool failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const deleteTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const toolId = req.params.toolId;
    
    await toolService.deleteTool(toolId, userId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete tool failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const callTool = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const toolId = req.params.toolId;
    const input = req.body;
    
    const result = await toolService.callTool(toolId, userId, input);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Call tool failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createTool,
  getUserTools,
  getTool,
  updateTool,
  deleteTool,
  callTool
};
