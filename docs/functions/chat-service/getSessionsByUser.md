tags: [chat, session, user]
role: backend-developer

# getSessionsByUser(userId, options)

Paginated list of a user's chat sessions that have at least one message.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | ObjectId | required | User to list sessions for |
| options | Object | `{}` | Pagination options |

**Options defaults:** `page: 1`, `limit: 10`.

**Returns:** `{ success: true, data: { sessions: [...], total, page, limit, totalPages } }` where each session object contains:

- `chat_id` — session ID as string
- `session_name` — display name
- `message_count` — number of messages
- `last_message` — last assistant message preview (truncated to 50 chars with `"..."`)
- `created_at`, `updated_at` — timestamps

Sessions are sorted by `created_at` descending.

---
[Back to Chat Service Functions](./chat-service-functions.md)
