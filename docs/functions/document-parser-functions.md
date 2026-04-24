tags: [rag, parsing, documents, file-processing]
role: backend-developer

# Document Parser Functions

Documented from `src/services/documentParser.js`. The document parser handles extraction of text content from various file formats for RAG (Retrieval-Augmented Generation) indexing.

## Supported File Formats

| Format | Function | Library | Output |
|--------|----------|---------|--------|
| PDF | `parsePDF()` | pdf-parse | `{ text, totalPages }` |
| DOCX | `parseDOCX()` | mammoth | `{ text }` |
| XLSX | `parseXLSX()` | xlsx | `{ text, sheetNames }` |
| CSV | `parseCSV()` | custom parser | `{ text }` |
| TXT | `parseTXT()` | built-in Buffer | `{ text }` |
| Markdown | `parseMD()` | built-in regex | `{ text }` |
| JSON | `parseJSON()` | built-in JSON.parse | `{ text }` |

## parsePDF(buffer)

Extracts text content from a PDF file using the `pdf-parse` library.

**Parameters:** `buffer` — Node.js Buffer containing raw PDF data.

**Returns:** `{ text: string, totalPages: number }`.

**Error handling:** If the PDF is password-protected, throws an object `{ type: 'encrypted', message: 'PDF is password-protected and cannot be parsed' }` (detected by `error.code === 'ENCRYPTED'`). Other errors throw a standard Error with prefix `"Failed to parse PDF:"`.

## parseDOCX(buffer)

Extracts raw text from a Word document using the `mammoth` library.

**Parameters:** `buffer` — Node.js Buffer containing raw DOCX data.

**Returns:** `{ text: string }`. Formatting is stripped; only raw text is returned. Empty documents return `{ text: '' }`.

**Error handling:** Throws `Error('Failed to parse DOCX: ...')`.

## parseXLSX(buffer)

Extracts text from an Excel workbook by converting each sheet to Markdown table format.

**Parameters:** `buffer` — Node.js Buffer containing raw XLSX data.

**Returns:** `{ text: string, sheetNames: string[] }`.

**Sheet conversion process:** Each sheet is converted using `xlsx.utils.sheet_to_json(worksheet, { header: 1 })`, then formatted as a Markdown table with header row and separator row. Sheets are prefixed with `## SheetName` headers and joined with double newlines.

```
Example output for a workbook with "Sales" and "Inventory" sheets:

## Sales
| Product | Q1 | Q2 | Q3 | Q4 |
| --- | --- | --- | --- | --- |
| Widget A | 100 | 150 | 200 | 250 |
| Widget B | 80 | 90 | 110 | 130 |

## Inventory
| Item | Stock | Location |
| --- | --- | --- |
| Widget A | 500 | Warehouse 1 |
```

**Error handling:** Throws `Error('Failed to parse XLSX: ...')`.

## parseCSV(buffer)

Custom CSV parser with full quote handling (escaped quotes, quoted fields containing commas).

**Parameters:** `buffer` — Node.js Buffer containing raw CSV data.

**Returns:** `{ text: string }` where each data row is formatted as `"key1: value1, key2: value2"`.

**Processing steps:**
1. Converts buffer to UTF-8 string and strips BOM (U+FEFF) if present
2. Splits by line (`\r?\n`) and filters empty lines
3. First line is parsed as headers using `parseCSVLine()`
4. Each subsequent row is paired with headers into key-value entries
5. Rows joined with newlines

**Quote handling in `parseCSVLine()`:**

```
  parseCSVLine(line)
        │
  For each character:
    ┌───────────────────────────────┐
    │ In quotes?                    │
    │   YES → " followed by " ?     │
    │         Yes → escaped quote   │
    │         No  → end of quoted   │
    │               field            │
    │   NO  → " → enter quote mode  │
    │        , → push field, reset   │
    │        else → accumulate       │
    └───────────────┬───────────────┘
                    │
  Push remaining field
  Return fields array
```

**Error handling:** Throws `Error('Failed to parse CSV: ...')`.

## parseTXT(buffer)

Plain text extraction with line ending normalization.

**Parameters:** `buffer` — Node.js Buffer containing raw text data.

**Returns:** `{ text: string }`.

**Processing steps:**
1. Converts buffer to UTF-8 string, strips BOM if present
2. Normalizes all line endings (`\r\n`, `\r`) to `\n`
3. Collapses 3+ consecutive blank lines into exactly 3 (preserving paragraph breaks)
4. Trims leading/trailing whitespace

**Error handling:** Throws `Error('Failed to parse TXT: ...')`.

## parseMD(buffer)

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

## parseJSON(buffer)

Recursively converts JSON data to a plain text representation.

**Parameters:** `buffer` — Node.js Buffer containing raw JSON data.

**Returns:** `{ text: string }`.

**Conversion rules in `convertJSONToText(data, prefix)`:**

| Type | Output format |
|------|--------------|
| `null` / `undefined` | `"prefix: null"` |
| String | Returned as-is |
| Number / Boolean | Converted to string |
| Array | Indexed by position: `"prefix[0]: value"`, `"prefix[1]: value"` |
| Object | Recursive key-value: `"prefix.key: value"` or nested objects |
| Nested objects | Dot-separated keys with newlines between entries |

**Example:**

```json
{ "name": "John", "scores": [95, 87, 92], "meta": { "active": true } }
```

Becomes:

```
name: John
scores[0]: 95
scores[1]: 87
scores[2]: 92
meta.active: true
```

**Error handling:** Throws `Error('Failed to parse JSON: ...')` for invalid JSON.

## parseFile(buffer, fileType)

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
