tags: [rag, parsing, pdf]
role: backend-developer

# parsePDF(buffer)

Extracts text content from a PDF file using the `pdf-parse` library.

**Parameters:** `buffer` — Node.js Buffer containing raw PDF data.

**Returns:** `{ text: string, totalPages: number }`.

**Error handling:** If the PDF is password-protected, throws an object `{ type: 'encrypted', message: 'PDF is password-protected and cannot be parsed' }` (detected by `error.code === 'ENCRYPTED'`). Other errors throw a standard Error with prefix `"Failed to parse PDF:"`.

---
[Back to Document Parser Functions](./document-parser-functions.md)
