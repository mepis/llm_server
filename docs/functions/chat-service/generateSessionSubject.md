tags: [chat, session]
role: backend-developer

# generateSessionSubject(messages)

Generates a short subject line from the first user message in a session. Used to auto-name sessions that were created as "New Chat".

**Logic:** Takes the first user message (string content, non-empty). If length is 60 characters or fewer, returns it as-is. If longer, truncates at 57 characters and removes the last word, appending `"..."`. Maximum output: 60 characters.

---
[Back to Chat Service Functions](./chat-service-functions.md)
