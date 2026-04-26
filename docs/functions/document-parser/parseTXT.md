tags: [rag, parsing, txt]
role: backend-developer

# parseTXT(buffer)

Plain text extraction with line ending normalization.

**Parameters:** `buffer` — Node.js Buffer containing raw text data.

**Returns:** `{ text: string }`.

**Processing steps:**
1. Converts buffer to UTF-8 string, strips BOM if present
2. Normalizes all line endings (`\r\n`, `\r`) to `\n`
3. Collapses 3+ consecutive blank lines into exactly 3 (preserving paragraph breaks)
4. Trims leading/trailing whitespace

**Error handling:** Throws `Error('Failed to parse TXT: ...')`.

---
[Back to Document Parser Functions](./document-parser-functions.md)
