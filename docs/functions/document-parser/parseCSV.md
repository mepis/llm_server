tags: [rag, parsing, csv]
role: backend-developer

# parseCSV(buffer)

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

---
[Back to Document Parser Functions](./document-parser-functions.md)
