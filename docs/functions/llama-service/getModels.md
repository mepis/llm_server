tags: [llama, model, cache]
role: backend-developer

# getModels()

Fetches available models from the Llama.cpp server at `GET ${config.llama.url}/v1/models`.

**Caching:** Results are cached for 60 seconds (`CACHE_TTL = 60000ms`). Subsequent calls within the TTL window return the cached result without hitting the server.

**Cache lifecycle:**

```
  ┌───────────────────────────────────────────────┐
  │             Model Cache Lifecycle              │
  └───────────────────────────────────────────────┘

  getModels() called
        │
   ┌────▼─────┐
   │ Cached?  │──── YES ──→ return cachedModels
   │ expired? │
   └────┬─────┘
      NO
        │
        ▼
  GET /v1/models from Llama.cpp
        │
   ┌────▼─────┐
   │ Success? │──── YES ──→ cache result, set timestamp
   └────┬─────┘          return cachedModels
      NO
        │
        ▼
  throw error (logged)
```

**Returns:** The raw response data from Llama.cpp's models endpoint (typically `{ object: "list", data: [{ id, name, ... }] }`).

---
[Back to Llama Service Functions](./llama-service-functions.md)
