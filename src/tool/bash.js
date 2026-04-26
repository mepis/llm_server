const { defineTool } = require('../tool/tool');
const zod = require('zod');
const piscina = require('../config/workerPool');
const logger = require('../utils/logger');

const DANGEROUS_PATTERNS = [
  { regex: /;/, desc: 'command chaining with semicolons' },
  { regex: /&&/, desc: 'AND command chaining' },
  { regex: /\|\|/, desc: 'OR command chaining' },
  { regex: /`/, desc: 'backtick command substitution' },
  { regex: /\$\(/, desc: 'parenthesized command substitution' },
];

function validateCommandInput(command) {
  if (typeof command !== 'string' || command.trim().length === 0) {
    throw new Error('Command must be a non-empty string');
  }
  for (const { regex, desc } of DANGEROUS_PATTERNS) {
    if (regex.test(command)) {
      logger.warn(`Bash command blocked: ${desc} detected in "${command.substring(0, 100)}"`);
      throw new Error(`Command rejected for security reasons: ${desc} is not allowed. Use pipes (|), redirects (>), and simple commands only.`);
    }
  }
}

const bashTool = defineTool('bash', {
  description:
    'Execute a bash command in the project directory. Use for running commands, scripts, and system operations. Supports workdir and timeout parameters. Does not allow command chaining (;, &&, ||) or command substitution (`, $()).',
  parameters: zod.object({
    command: zod.string().describe('The bash command to execute (no ;/&&/||/`/$() allowed)'),
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

    validateCommandInput(command);

    const result = await piscina.run({
      type: 'bash',
      command,
      workdir: workdir || process.cwd(),
      timeout: Math.min(timeout || 30000, 120000),
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
