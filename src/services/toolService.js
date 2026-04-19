const Tool = require('../models/Tool');
const logger = require('../utils/logger');

const createTool = async (userId, name, description, code, parameters = [], isActive = true) => {
  try {
    const tool = await Tool.create({
      user_id: userId,
      name,
      description,
      code,
      parameters,
      is_active: isActive
    });
    
    logger.info(`Tool created: ${tool.name} for user ${userId}`);
    
    return {
      success: true,
      data: tool
    };
  } catch (error) {
    logger.error('Create tool failed:', error.message);
    throw error;
  }
};

const getUserTools = async (userId) => {
  try {
    const tools = await Tool.find({ user_id: userId })
      .sort({ created_at: -1 });
    
    return {
      success: true,
      data: tools
    };
  } catch (error) {
    logger.error('Get user tools failed:', error.message);
    throw error;
  }
};

const getTool = async (toolId, userId) => {
  try {
    const tool = await Tool.findOne({
      _id: toolId,
      user_id: userId
    });
    
    if (!tool) {
      throw new Error('Tool not found');
    }
    
    return {
      success: true,
      data: tool
    };
  } catch (error) {
    logger.error('Get tool failed:', error.message);
    throw error;
  }
};

const updateTool = async (toolId, userId, updates) => {
  try {
    const tool = await Tool.findOneAndUpdate(
      { _id: toolId, user_id: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!tool) {
      throw new Error('Tool not found');
    }
    
    logger.info(`Tool updated: ${toolId}`);
    
    return {
      success: true,
      data: tool
    };
  } catch (error) {
    logger.error('Update tool failed:', error.message);
    throw error;
  }
};

const deleteTool = async (toolId, userId) => {
  try {
    const tool = await Tool.findOneAndDelete({
      _id: toolId,
      user_id: userId
    });
    
    if (!tool) {
      throw new Error('Tool not found');
    }
    
    logger.info(`Tool deleted: ${toolId}`);
    
    return { success: true };
  } catch (error) {
    logger.error('Delete tool failed:', error.message);
    throw error;
  }
};

const executeTool = async (toolId, userId, inputParams) => {
  try {
    const tool = await Tool.findOne({
      _id: toolId,
      user_id: userId
    });
    
    if (!tool) {
      throw new Error('Tool not found or access denied');
    }
    
    if (!tool.is_active) {
      throw new Error('Tool is disabled');
    }
    
    return {
      success: true,
      data: {
        tool: tool.name,
        input: inputParams,
        output: 'Tool execution requires worker thread pool'
      }
    };
  } catch (error) {
    logger.error('Execute tool failed:', error.message);
    throw error;
  }
};

module.exports = {
  createTool,
  getUserTools,
  getTool,
  updateTool,
  deleteTool,
  executeTool
};
