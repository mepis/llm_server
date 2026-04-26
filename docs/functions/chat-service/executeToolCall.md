tags: [chat, internal, tools]
role: backend-developer

# executeToolCall(toolCall, session, allTools)

**Internal Function**

Internal tool execution:

1. Parses tool name, ID, and arguments from the tool_call object
2. Creates a `ToolCall` document with state `'running'`
3. Finds the matching tool from `allTools` by name
4. Builds a context object: `{ sessionID, messageID, agent: 'assistant', abort, messages, metadata, ask }`
5. Executes `tool.execute(input, ctx)`
6. Updates ToolCall document to `'completed'` or `'error'` state

---
[Back to Chat Service Functions](./chat-service-functions.md)
