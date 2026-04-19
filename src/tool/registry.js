const Tool = require('../models/Tool');
const { toOpenAITool } = require('./tool');

const builtinTools = new Map();

function registerBuiltin(tool) {
  builtinTools.set(tool.id, tool);
}

function getBuiltinTools() {
  return Array.from(builtinTools.values());
}

async function loadCustomTools(model) {
  try {
    const tools = await Tool.find({
      is_active: true,
    }).sort({ created_at: -1 });

    return tools.map((t) => ({
      id: t.name,
      description: t.description,
      parameters: buildZodSchemaFromParameters(t.parameters),
      execute: async (args, ctx) => {
        const result = await executeCustomTool(t, args);
        return result;
      },
    }));
  } catch (error) {
    console.error('Failed to load custom tools:', error.message);
    return [];
  }
}

function buildZodSchemaFromParameters(parameters) {
  if (!parameters || parameters.length === 0) {
    return null;
  }

  const zod = require('zod');
  const shape = {};

  for (const param of parameters) {
    let field;

    switch (param.type) {
      case 'string':
        field = zod.string().optional().describe(param.description || '');
        break;
      case 'number':
        field = zod.number().optional().describe(param.description || '');
        break;
      case 'integer':
        field = zod.number().int().optional().describe(param.description || '');
        break;
      case 'boolean':
        field = zod.boolean().optional().describe(param.description || '');
        break;
      case 'array':
        field = zod.array(zod.string()).optional().describe(param.description || '');
        break;
      default:
        field = zod.string().optional().describe(param.description || '');
    }

    if (param.required) {
      field = field.refine(() => true, { message: 'Required field' });
      shape[param.name] = field;
    } else {
      shape[param.name] = field;
    }
  }

  return zod.object(shape);
}

async function executeCustomTool(tool, args) {
  try {
    const code = tool.code;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('params', code);

    const result = await fn(args);

    return {
      output:
        typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      title: tool.name,
      metadata: {},
    };
  } catch (error) {
    return {
      output: `Error executing tool "${tool.name}": ${error.message}`,
      title: tool.name,
      metadata: { error: true },
    };
  }
}

function toOpenAITools(tools) {
  return tools.map(toOpenAITool);
}

module.exports = {
  registerBuiltin,
  getBuiltinTools,
  loadCustomTools,
  toOpenAITools,
};
