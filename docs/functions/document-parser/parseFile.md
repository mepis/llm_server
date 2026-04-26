tags: [rag, parsing, router]
role: backend-developer

# parseFile(buffer, fileType)

Router function that dispatches to the correct parser based on file type.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| buffer | Buffer | Raw file data |
| fileType | String | File type identifier (case-insensitive) |

**Type normalization:** Converts `fileType` to lowercase and trims whitespace. Accepts aliases: `'txt'` / `'text'`, `'md'` / `'markdown'`.

**Dispatch flow:**

```
  parseFile(buffer, fileType)
        │
  Normalize type → lowercase + trim
        │
  ┌───────────────────────────────┐
  │ Switch on normalized type:    │
  │   pdf    → parsePDF()         │
  │   docx   → parseDOCX()        │
  │   xlsx   → parseXLSX()        │
  │   csv    → parseCSV()         │
  │   txt/text → parseTXT()       │
  │   md/markdown → parseMD()     │
  │   json   → parseJSON()        │
  │   default → throw Error       │
  └───────────────────────────────┘
```

**Supported types:** `pdf`, `docx`, `xlsx`, `csv`, `txt`, `text`, `md`, `markdown`, `json`.

**Throws:** `Error('Unsupported file type: <fileType>')` for any unrecognized type.

---
[Back to Document Parser Functions](./document-parser-functions.md)
