tags: [chat, assistant, tools, streaming]
role: backend-developer

# Chat Service Functions

Documented from `src/services/chatService.js`. The chat service manages conversation sessions, message flow, tool execution, and multi-turn interactions with the LLM.

## Functions

- [createChatSession](./chat-service/createChatSession.md) - Creates a new chat session in the database.
- [addMessageToSession](./chat-service/addMessageToSession.md) - Adds a message to an existing session.
- [getMessages](./chat-service/getMessages.md) - Returns all messages stored in a session.
- [chatWithLLM](./chat-service/chatWithLLM.md) - Single-turn chat interaction with LLM.
- [runLoop](./chat-service/runLoop.md) - Multi-turn conversation loop.
- [streamRunLoop](./chat-service/streamRunLoop.md) - Async generator for multi-turn loop.
- [streamChatResponse](./chat-service/streamChatResponse.md) - Simple text-only streaming.
- [clearSessionMessages](./chat-service/clearSessionMessages.md) - Clears messages from a session.
- [updateSessionMemory](./chat-service/updateSessionMemory.md) - Updates session metadata and memory.
- [getSessionsByUser](./chat-service/getSessionsByUser.md) - Retrieves a user's chat sessions.
- [deleteSession](./chat-service/deleteSession.md) - Deletes a session and tool calls.
- [generateSessionSubject](./chat-service/generateSessionSubject.md) - Auto-generates a session name.
- [getToolCalls](./chat-service/getToolCalls.md) - Retrieves tool calls from a session.

## Internal Functions

- [buildMessages](./chat-service/buildMessages.md) - Transforms messages to OpenAI format.
- [resolveTools](./chat-service/resolveTools.md) - Combines and prepares tools for LLM.
- [executeToolCall](./chat-service/executeToolCall.md) - Executes a specific tool call.

---
[Back to Index](../index.md)
