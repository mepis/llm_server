tags: [rag, parsing, xlsx]
role: backend-developer

# parseXLSX(buffer)

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

---
[Back to Document Parser Functions](./document-parser-functions.md)
