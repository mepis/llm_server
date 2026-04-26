tags: [rag, parsing, docx]
role: backend-developer

# parseDOCX(buffer)

Extracts raw text from a Word document using the `mammoth` library.

**Parameters:** `buffer` — Node.js Buffer containing raw DOCX data.

**Returns:** `{ text: string }`. Formatting is stripped; only raw text is returned. Empty documents return `{ text: '' }`.

**Error handling:** Throws `Error('Failed to parse DOCX: ...')`.

---
[Back to Document Parser Functions](./document-parser-functions.md)
