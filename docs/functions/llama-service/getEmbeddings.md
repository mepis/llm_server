tags: [llama, embeddings]
role: backend-developer

# getEmbeddings(texts, model)

Creates embeddings via `POST ${config.llama.url}/v1/embeddings`.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| texts | String or Array | — | Text(s) to embed |
| model | String | `'all-MiniLM-L6-v2'` | Embedding model name |

**Returns:** `{ data: [{ embedding: number[], ... }] }` — array of embedding vectors.

---
[Back to Llama Service Functions](./llama-service-functions.md)
