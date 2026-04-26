tags: [tools, registry, openai]
role: backend-developer

# toOpenAITools(tools)

**Internal Function**

Converts an array of tool objects to OpenAI function format using `toOpenAITool()` from `src/tool/tool.js`. Each tool becomes:

```json
{
  "type": "function",
  "function": {
    "name": "<tool.id>",
    "description": "<tool.description>",
    "parameters": { "<JSON schema derived from Zod>" }
  }
}
```

---
[Back to Tool Service Functions](./tool-service-functions.md)
