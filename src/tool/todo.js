const zod = require('zod');
const { defineTool } = require('../tool/tool');

const todoTool = defineTool('todo', {
  description:
    'Manage a task list. Use for tracking multi-step tasks. Supports add, complete, and remove operations. Returns the current state of the task list.',
  parameters: zod.object({
    operation: zod
      .enum(['add', 'complete', 'remove', 'list'])
      .describe('The operation to perform: add, complete, remove, or list'),
    text: zod
      .string()
      .optional()
      .describe(
        'Task description. Required for add operation.'
      ),
    index: zod
      .number()
      .int()
      .optional()
      .describe(
        'Task index (0-based). Required for complete and remove operations.'
      ),
  }),
  execute: async (args, ctx) => {
    const session = await require('../models/ChatSession').findById(
      ctx.sessionID
    );

    if (!session) {
      return {
        output: 'Error: Session not found',
        title: 'Todo',
        metadata: { error: true },
      };
    }

    if (!session.metadata?.todos) {
      session.metadata.todos = [];
    }

    const todos = session.metadata.todos;

    switch (args.operation) {
      case 'add': {
        if (!args.text) {
          return {
            output: 'Error: "text" is required for add operation',
            title: 'Todo',
            metadata: { error: true },
          };
        }
        todos.push({ text: args.text, done: false });
        await session.save();
        return {
          output: buildTodoList(todos),
          title: `Todo: Added "${args.text.substring(0, 50)}"`,
          metadata: { count: todos.length },
        };
      }

      case 'complete': {
        if (args.index === undefined || args.index < 0 || args.index >= todos.length) {
          return {
            output: `Error: Invalid index ${args.index}. List has ${todos.length} items (indices 0-${todos.length - 1}).`,
            title: 'Todo',
            metadata: { error: true },
          };
        }
        todos[args.index].done = true;
        await session.save();
        return {
          output: buildTodoList(todos),
          title: `Todo: Completed task #${args.index}`,
          metadata: { count: todos.length },
        };
      }

      case 'remove': {
        if (args.index === undefined || args.index < 0 || args.index >= todos.length) {
          return {
            output: `Error: Invalid index ${args.index}. List has ${todos.length} items (indices 0-${todos.length - 1}).`,
            title: 'Todo',
            metadata: { error: true },
          };
        }
        const removed = todos.splice(args.index, 1)[0];
        await session.save();
        return {
          output: buildTodoList(todos),
          title: `Todo: Removed "${removed.text.substring(0, 50)}"`,
          metadata: { count: todos.length },
        };
      }

      case 'list':
      default:
        return {
          output: buildTodoList(todos),
          title: 'Todo: Current task list',
          metadata: { count: todos.length },
        };
    }
  },
});

function buildTodoList(todos) {
  if (todos.length === 0) {
    return 'No tasks. Use "add" to create a task.';
  }

  const lines = todos.map((t, i) => {
    const status = t.done ? '[x]' : '[ ]';
    return `${i}: ${status} ${t.text}`;
  });

  const done = todos.filter((t) => t.done).length;
  const total = todos.length;

  return `${lines.join('\n')}\n\nProgress: ${done}/${total} completed`;
}

module.exports = { todoTool };
