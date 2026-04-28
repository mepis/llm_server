const fs = require('fs');
const path = require('path');
const { defineTool } = require('../tool/tool');
const zod = require('zod');

const writeTool = defineTool('write', {
  description:
    'Write or overwrite a file. Use with the search_and_replace parameter to edit existing files by finding a string and replacing it. For new files, use content parameter.',
  parameters: zod.object({
    path: zod.string().describe('Absolute or relative path to the file'),
    content: zod
      .string()
      .optional()
      .describe(
        'The content to write to the file. Required for new files or full overwrite.'
      ),
    search_and_replace: zod
      .object({
        old_str: zod.string().describe('The exact string to find and replace'),
        new_str: zod.string().describe('The replacement string'),
      })
      .optional()
      .describe(
        'Search and replace to edit an existing file. old_str must match exactly.'
      ),
  }),
  execute: async (args, ctx) => {
    let filePath = args.path;

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }

    if (args.search_and_replace) {
      if (!fs.existsSync(filePath)) {
        return {
          output: `Error: File not found: ${args.path}`,
          title: `Write: ${args.path}`,
          metadata: { error: true },
        };
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      const { old_str, new_str } = args.search_and_replace;

      if (!content.includes(old_str)) {
        return {
          output: `Error: String not found in file:\n"${old_str.substring(0, 200)}"\n\nHint: The string must match exactly, including whitespace. Use the read tool to inspect the file first.`,
          title: `Write: ${args.path}`,
          metadata: { error: true },
        };
      }

      const count = (content.match(new RegExp(old_str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [])
        .length;

      if (count > 1) {
        return {
          output: `Error: String found ${count} times. Must be unique. Use a larger string with more context to make it unique.`,
          title: `Write: ${args.path}`,
          metadata: { error: true, occurrences: count },
        };
      }

      content = content.replace(old_str, new_str);
      fs.writeFileSync(filePath, content, 'utf-8');

      const oldLines = content.split('\n').length;
      return {
        output: `File modified: ${args.path}\nReplaced 1 occurrence.\nFile now has ${oldLines} lines.`,
        title: `Write: ${args.path}`,
        metadata: { mode: 'search_replace', occurrences: 1 },
      };
    }

    if (!args.content) {
      return {
        output: 'Error: Either content or search_and_replace is required.',
        title: `Write: ${args.path}`,
        metadata: { error: true },
      };
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, args.content, 'utf-8');

    const lines = args.content.split('\n').length;
    return {
      output: `File written: ${args.path}\n${lines} lines written.`,
      title: `Write: ${args.path}`,
      metadata: { mode: 'write', lines },
    };
  },
});

module.exports = { writeTool };
