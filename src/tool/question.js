const zod = require('zod');
const { defineTool } = require('../tool/tool');

const questionTool = defineTool('question', {
  description:
    'Ask the user a question. Use when you need clarification or user input before proceeding. The user will provide a text response. Returns the user\'s answer.',
  parameters: zod.object({
    question: zod
      .string()
      .describe('The question to ask the user. Be specific and clear.'),
  }),
  execute: async (args, ctx) => {
    await ctx.ask({
      question: args.question,
      sessionID: ctx.sessionID,
      messageID: ctx.messageID,
    });

    return {
      output: `Question asked: "${args.question}"\nWaiting for user response...`,
      title: `Question: ${args.question.substring(0, 80)}`,
      metadata: { pending: true },
    };
  },
});

module.exports = { questionTool };
