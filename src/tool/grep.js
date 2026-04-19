const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const { defineTool } = require('../tool/tool');
const zod = require('zod');

const MAX_GREP_RESULTS = 100;
const MAX_GREP_BYTES = 50 * 1024;

function grepFiles(pattern, files, contextLines = 0) {
  const results = [];
  let totalBytes = 0;

  const regex = new RegExp(pattern, 'g');

  for (const file of files) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          regex.lastIndex = 0;

          const start = Math.max(0, i - contextLines);
          const end = Math.min(lines.length - 1, i + contextLines);

          for (let j = start; j <= end; j++) {
            const prefix = j === i ? '>>>' : '   ';
            results.push(
              `${prefix} ${file}:${j + 1}: ${lines[j]}`
            );
            totalBytes += Buffer.byteLength(lines[j]);
          }

          if (results.length >= MAX_GREP_RESULTS) break;
        }
      }
    } catch (e) {
      // Skip files we can't read
    }

    if (results.length >= MAX_GREP_RESULTS || totalBytes > MAX_GREP_BYTES) break;
  }

  return results;
}

const grepTool = defineTool('grep', {
  description:
    'Search for a regex pattern in files. Supports recursive search with path parameter, file filtering with include parameter, and context lines around matches.',
  parameters: zod.object({
    pattern: zod
      .string()
      .describe('Regular expression pattern to search for'),
    path: zod
      .string()
      .optional()
      .describe(
        'Directory to search in. Defaults to current working directory.'
      ),
    include: zod
      .string()
      .optional()
      .describe(
        'File pattern to filter by (e.g., "*.js", "*.ts"). Supports glob patterns.'
      ),
    context: zod
      .number()
      .optional()
      .describe(
        'Number of context lines to show before and after each match. Defaults to 0.'
      ),
  }),
  execute: async (args, ctx) => {
    const searchPath = args.path || process.cwd();
    const includePattern = args.include;

    let files;

    if (includePattern) {
      files = globSync(path.join(searchPath, includePattern), {
        absolute: true,
        nodir: true,
      });
    } else {
      files = globSync(path.join(searchPath, '**', '*'), {
        absolute: true,
        nodir: true,
      });
    }

    const results = grepFiles(args.pattern, files, args.context || 0);

    if (results.length === 0) {
      return {
        output: `No matches found for pattern "${args.pattern}"`,
        title: `Grep: ${args.pattern}`,
        metadata: { count: 0 },
      };
    }

    let output;
    if (results.length > MAX_GREP_RESULTS) {
      output = results.slice(0, MAX_GREP_RESULTS).join('\n');
      output += `\n... ${results.length - MAX_GREP_RESULTS} more results (limit: ${MAX_GREP_RESULTS})`;
    } else {
      output = results.join('\n');
    }

    return {
      output,
      title: `Grep: ${args.pattern}`,
      metadata: { count: results.length },
    };
  },
});

module.exports = { grepTool };
