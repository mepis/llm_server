import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Search the web",
  args: {
    query: tool.schema.string().describe("Search phrase used for web search"),
  },
  async execute(args, context) {
    const script =
      "/home/jon/git/llm_server/integrations/opencode/tools/searxng/search.js";

    const result = await Bun.$`node ${script} ${args.query}`.text();
    return result.trim();
  },
});
