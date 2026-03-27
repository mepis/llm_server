import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Use this tool to search the web or find information.",
  args: {
    query: tool.schema.string().describe("Search phrase used for web search"),
  },
  async execute(args, context) {
    const script =
      "/home/jon/.config/opencode/tools/search.js";

    const result = await Bun.$`node ${script} ${args.query}`.text();
    return result.trim();
  },
});
