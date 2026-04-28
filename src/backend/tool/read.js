const fs = require('fs');
const path = require('path');
const { defineTool } = require('../tool/tool');
const zod = require('zod');

const MAX_READ_LINES = 500;
const MAX_READ_BYTES = 50 * 1024;

const readTool = defineTool('read', {
  description:
    'Read the contents of a file at the specified path. Supports reading a range of lines. Returns file content with line numbers. Detects binary files and refuses to read them.',
  parameters: zod.object({
    path: zod.string().describe('Absolute or relative path to the file to read'),
    head: zod
      .number()
      .optional()
      .describe(
        'Maximum number of lines to read from the beginning. Defaults to 500.'
      ),
    tail: zod
      .number()
      .optional()
      .describe(
        'Maximum number of lines to read from the end. Cannot be used with head.'
      ),
  }),
  execute: async (args, ctx) => {
    let filePath = args.path;

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }

    if (!fs.existsSync(filePath)) {
      return {
        output: `Error: File not found: ${args.path}`,
        title: `Read: ${args.path}`,
        metadata: { error: true },
      };
    }

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const entries = fs.readdirSync(filePath, { withFileTypes: true });
      const lines = entries.map((e) =>
        e.isDirectory() ? `DIR  ${e.name}/` : `FILE ${e.name}`
      );
      return {
        output: lines.join('\n'),
        title: `Directory listing: ${args.path}`,
        metadata: { isDirectory: true, count: entries.length },
      };
    }

    if (stats.size > MAX_READ_BYTES) {
      return {
        output: `Error: File too large (${stats.size} bytes). Use head/tail to read portions, or use grep/glob to search.`,
        title: `Read: ${args.path}`,
        metadata: { error: true, fileSize: stats.size },
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const isBinary = /[\x00-\x08\x0E-\x1F\x7F]/.test(content);
    if (isBinary) {
      return {
        output: `Error: File appears to be binary: ${args.path}`,
        title: `Read: ${args.path}`,
        metadata: { error: true, isBinary: true },
      };
    }

    const lines = content.split('\n');
    let resultLines;

    if (args.tail && !args.head) {
      resultLines = lines.slice(-args.tail);
    } else if (args.head) {
      resultLines = lines.slice(0, args.head);
    } else {
      resultLines = lines.slice(0, MAX_READ_LINES);
    }

    const numberedLines = resultLines.map(
      (line, i) => `${(args.tail ? lines.length - args.tail + i : i + 1)}: ${line}`
    );

    let output = numberedLines.join('\n');

    if (resultLines.length >= MAX_READ_LINES && lines.length > MAX_READ_LINES) {
      output += `\n... (${lines.length - MAX_READ_LINES} more lines, use head/tail to read more)`;
    }

    return {
      output,
      title: `Read: ${args.path}`,
      metadata: {
        totalLines: lines.length,
        linesReturned: resultLines.length,
        fileSize: stats.size,
      },
    };
  },
});

module.exports = { readTool };
