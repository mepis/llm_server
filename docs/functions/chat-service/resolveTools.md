tags: [chat, internal, tools]
role: backend-developer

# resolveTools(session)

**Internal Function**

Combines builtin tools (bash, read, write, glob, grep, question, todo, skill) and custom tools loaded from the database. Converts to OpenAI function format via `toOpenAITools()`. Returns `{ tools: [...], openAITools: [...] }`.

---
[Back to Chat Service Functions](./chat-service-functions.md)
