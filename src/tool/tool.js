const zod = require('zod');
const { truncateOutput } = require('./truncate');

function wrapExecute(executeFn, parameters) {
  return async function (args, ctx) {
    let validatedArgs = args;

    if (parameters) {
      try {
        validatedArgs = parameters.parse(args);
      } catch (error) {
        if (error instanceof zod.ZodError) {
          const messages = error.errors.map(
            (e) => `${e.path.join('.')}: ${e.message}`
          );
          throw new Error(`Validation error: ${messages.join(', ')}`);
        }
        throw error;
      }
    }

    const result = await executeFn(validatedArgs, ctx);

    if (result && typeof result.output === 'string') {
      result.output = truncateOutput(result.output);
    }

    return result;
  };
}

function defineTool(id, config) {
  const { description, parameters, execute, formatValidationError } = config;

  return {
    id,
    description,
    parameters,
    execute: wrapExecute(execute, parameters),
    formatValidationError,
  };
}

function toJSONSchema(schema) {
  if (!schema) return { type: 'object', properties: {} };

  const zodToJSONSchema = (zodSchema) => {
    const description = zodSchema.description || '';
    const type = zodSchema._def.typeName;

    switch (type) {
      case 'ZodString':
        return { type: 'string', description };
      case 'ZodNumber':
        return { type: 'number', description };
      case 'ZodBoolean':
        return { type: 'boolean', description };
      case 'ZodEnum':
        return {
          type: 'string',
          enum: zodSchema._def.values,
          description,
        };
      case 'ZodNativeEnum':
        return {
          type: 'string',
          enum: Object.values(zodSchema._def.values),
          description,
        };
      case 'ZodArray':
        return {
          type: 'array',
          items: zodToJSONSchema(zodSchema._def.type),
          description,
        };
      case 'ZodObject': {
        const shape = zodSchema._def.shape();
        const properties = {};
        const required = [];

        for (const [key, field] of Object.entries(shape)) {
          properties[key] = zodToJSONSchema(field);
          if (!field.isOptional()) {
            required.push(key);
          }
        }

        const schema = { type: 'object', properties, description };
        if (required.length > 0) {
          schema.required = required;
        }
        return schema;
      }
      case 'ZodNullable':
      case 'ZodOptional':
        return zodToJSONSchema(zodSchema._def.innerType);
      case 'ZodDefault':
        return zodToJSONSchema(zodSchema._def.innerType);
      default:
        return { type: 'string', description };
    }
  };

  return zodToJSONSchema(schema);
}

function toOpenAITool(tool) {
  const jsonSchema = toJSONSchema(tool.parameters);

  return {
    type: 'function',
    function: {
      name: tool.id,
      description: tool.description,
      parameters: jsonSchema,
    },
  };
}

module.exports = {
  defineTool,
  truncateOutput,
  toJSONSchema,
  toOpenAITool,
};
