const Tool = require('../models/Tool');
const logger = require('../utils/logger');

const createTool = async (userId, name, description, parameters, code, isActive, roles) => {
  try {
    const tool = await Tool.create({
      user_id: userId,
      name,
      description,
      code,
      parameters,
      is_active: isActive,
      roles,
    });

    logger.info(`Tool created: ${tool.name} for user ${userId}`);

    return {
      success: true,
      data: tool,
    };
  } catch (error) {
    logger.error('Create tool failed:', error.message);
    throw error;
  }
};

const getAccessibleTools = async (userRoles) => {
  try {
    const tools = await Tool.find({ roles: { $in: userRoles } }).sort({ created_at: -1 });

    return {
      success: true,
      data: tools,
    };
  } catch (error) {
    logger.error('Get accessible tools failed:', error.message);
    throw error;
  }
};

const getTool = async (toolId, userRoles) => {
  try {
    const tool = await Tool.findOne({
      _id: toolId,
      roles: { $in: userRoles },
    });

    if (!tool) {
      throw new Error('Tool not found');
    }

    return {
      success: true,
      data: tool,
    };
  } catch (error) {
    logger.error('Get tool failed:', error.message);
    throw error;
  }
};

const updateTool = async (toolId, updates) => {
  try {
    const tool = await Tool.findByIdAndUpdate(
      toolId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!tool) {
      throw new Error('Tool not found');
    }

    logger.info(`Tool updated: ${toolId}`);

    return {
      success: true,
      data: tool,
    };
  } catch (error) {
    logger.error('Update tool failed:', error.message);
    throw error;
  }
};

const deleteTool = async (toolId) => {
  try {
    const tool = await Tool.findByIdAndDelete(toolId);

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

const callTool = async (toolId, userRoles, input) => {
  try {
    const tool = await Tool.findOne({
      _id: toolId,
      roles: { $in: userRoles },
    });

    if (!tool) {
      throw new Error('Tool not found or access denied');
    }

    if (!tool.is_active) {
      throw new Error('Tool is disabled');
    }

    const parameters = tool.parameters || [];

    const zod = require('zod');
    const shape = {};

    for (const param of parameters) {
      let field;
      switch (param.type) {
        case 'string':
          field = zod.string().describe(param.description || '');
          break;
        case 'number':
          field = zod.number().describe(param.description || '');
          break;
        case 'boolean':
          field = zod.boolean().describe(param.description || '');
          break;
        default:
          field = zod.string().describe(param.description || '');
      }

      if (param.required) {
        shape[param.name] = field;
      } else {
        shape[param.name] = field.optional();
      }
    }

    let validatedArgs;
    try {
      const schema = zod.object(shape);
      validatedArgs = schema.parse(input);
    } catch (validationError) {
      if (validationError instanceof zod.ZodError) {
        const messages = validationError.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Validation error: ${messages.join(', ')}`);
      }
      throw validationError;
    }

    const code = tool.code;
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    
    let fnBody = code.trim();
    if (fnBody.startsWith('async function') || fnBody.startsWith('function')) {
      fnBody = fnBody.replace(/async\s+function\s*\([^)]*\)\s*\{/, '{').replace(/\}$/, '}');
    }
    
    const fn = new AsyncFunction('params', fnBody);

    const result = await fn(validatedArgs);

    return {
      success: true,
      data: {
        tool: tool.name,
        input: validatedArgs,
        output: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      },
    };
  } catch (error) {
    logger.error('Call tool failed:', error.message);
    throw error;
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
