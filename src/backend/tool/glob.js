const { globSync } = require('glob');
const { defineTool } = require('../tool/tool');
const zod = require('zod');

const MAX_GLOB_RESULTS = 100;

const globTool = defineTool('glob', {
  description:
    'Search for files matching a glob pattern. Supports ** for recursive matching, single char ?, and character sets []. Returns matching file paths.',
  parameters: zod.object({
    pattern: zod
      .string()
      .describe(
        'Glob pattern to match (e.g., "**/*.js", "src/**/*.ts", "test/*.test.js")'
      ),
    path: zod
      .string()
      .optional()
      .describe(
        'Root directory to search in. Defaults to current working directory.'
      ),
  }),
  execute: async (args, ctx) => {
    const pattern = args.pattern;
    const searchPath = args.path || process.cwd();

    try {
      const results = globSync(pattern, { cwd: searchPath, absolute: false });

      if (results.length === 0) {
        return {
          output: `No files matched pattern "${pattern}" in ${searchPath}`,
          title: `Glob: ${pattern}`,
          metadata: { count: 0 },
        };
      }

      let output;
      if (results.length > MAX_GLOB_RESULTS) {
        output = results
          .slice(0, MAX_GLOB_RESULTS)
          .sort()
          .join('\n');
        output += `\n... ${results.length - MAX_GLOB_RESULTS} more results (limit: ${MAX_GLOB_RESULTS})`;
      } else {
        output = results.sort().join('\n');
      }

      return {
        output,
        title: `Glob: ${pattern}`,
        metadata: { count: results.length },
      };
    } catch (err) {
      return {
        output: `Error searching for pattern "${pattern}": ${err.message}`,
        title: `Glob: ${pattern}`,
        metadata: { error: true },
      };
    }
  },
});

module.exports = { globTool };
