const { defineTool } = require('../tool/tool');
const zod = require('zod');
const piscina = require('../config/workerPool');

const bashTool = defineTool('bash', {
  description:
    'Execute a bash command in the project directory. Use for running commands, scripts, and system operations. Supports workdir and timeout parameters.',
  parameters: zod.object({
    command: zod.string().describe('The bash command to execute'),
    workdir: zod
      .string()
      .optional()
      .describe(
        'Working directory for the command. Defaults to the project root.'
      ),
    timeout: zod
      .number()
      .optional()
      .describe(
        'Timeout in milliseconds. Defaults to 30000 (30 seconds).'
      ),
    description: zod
      .string()
      .optional()
      .describe(
        'A brief description of what this command does, for logging purposes.'
      ),
  }),
  execute: async (args, ctx) => {
    const { command, workdir, timeout } = args;

    const result = await piscina.run({
      type: 'bash',
      command,
      workdir: workdir || process.cwd(),
      timeout: timeout || 30000,
      session_id: ctx.sessionID,
    });

    return {
      output: result.output,
      title: `Executed: ${command.substring(0, 80)}`,
      metadata: {
        exitCode: result.exitCode,
        timedOut: result.timedOut,
      },
    };
  },
});

module.exports = { bashTool };
