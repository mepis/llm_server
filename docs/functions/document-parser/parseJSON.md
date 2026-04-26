tags: [rag, parsing, json]
role: backend-developer

# parseJSON(buffer)

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

---
[Back to Document Parser Functions](./document-parser-functions.md)
