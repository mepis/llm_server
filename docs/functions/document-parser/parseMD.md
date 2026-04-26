tags: [rag, parsing, markdown]
role: backend-developer

# parseMD(buffer)

Strips all Markdown formatting and returns plain text.

**Parameters:** `buffer` — Node.js Buffer containing raw Markdown data.

**Returns:** `{ text: string }`.

**Formatting stripped (in order):**
1. Headings (`#` through `######`) — removes hash markers
2. Bold (`**text**`, `__text__`) — removes markers
3. Italic (`*text*`, `_text_`) — removes markers
4. Inline code (`` `code` ``) — removes backticks
5. Strikethrough (`~~text~~`) — removes tildes
6. Links (`[text](url)`) — keeps link text only
7. Blockquotes (`> text`) — removes `>` prefix
8. Horizontal rules (`---`, etc.) — removed entirely
9. Bullet list markers (`* item`) — removes `* ` prefix
10. Numbered list markers (`1. item`) — removes number prefix
11. Excessive blank lines collapsed to double newline

**Error handling:** Throws `Error('Failed to parse MD: ...')`.

---
[Back to Document Parser Functions](./document-parser-functions.md)
