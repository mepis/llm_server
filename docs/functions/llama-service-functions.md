tags: [llama, inference, streaming, embeddings, tts]
role: backend-developer

# Llama Service Functions

Documented from `src/services/llamaService.js`. The llama service handles all communication with the Llama.cpp inference server, including model listing, chat completions (with and without tools), embeddings, TTS, and health checks.

## getModels()

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

## getChatCompletions(messages, options)

Base completion endpoint. Posts messages to `POST ${config.llama.url}/v1/chat/completions`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| messages | Array | OpenAI-format message array with `role` and `content` |
| options | Object | LLM options: `temperature`, `max_tokens`, `top_p`, `stream: true/false` |

**Streaming:** When `options.stream: true`, returns an async iterable of SSE chunks. Each chunk follows the OpenAI streaming format: `{ choices: [{ delta: { content: "..." } }] }`.

**Returns (non-streaming):** `{ choices: [{ message: { role, content, tool_calls? } }] }`.

**Returns (streaming):** Async generator yielding parsed SSE event objects.

## chatWithTools(messages, tools, options)

Chat completion with OpenAI-format tool definitions. Posts to the same `/v1/chat/completions` endpoint but includes a `tools` array in the request body.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| messages | Array | Message history including system prompt |
| tools | Array | OpenAI-format tool definitions (`{ type: 'function', function: { name, description, parameters } }`) |
| options | Object | `temperature`, `max_tokens`, `top_p` |

**Returns:** `{ choices: [{ message: { role: 'assistant', content?, tool_calls? } }] }`. The response may contain either text content or tool_calls (or both).

## streamChatWithTools(messages, tools, options)

Streaming version of `chatWithTools`. Returns an async generator (`async *`) that parses SSE chunks and yields each parsed event.

**SSE parsing logic:**

```
  For each raw chunk from the HTTP stream:
    ┌──────────────────────────────┐
    │ Append to buffer             │
    │ Split by newlines            │
    │ Keep last partial line in    │
    │   buffer for next iteration  │
    └──────────────┬───────────────┘
                   │
    For each complete line:
      Starts with "data: "?
         YES → strip prefix
              Parse as JSON
              Yield parsed object
              If "[DONE]" → return (stop)
         NO  → skip
```

**Yielded event structure:** Each SSE `data:` line is returned as-is from Llama.cpp. For content streaming, events contain `{ choices: [{ delta: { content: "..." } }] }`. For tool call streaming, events contain `{ choices: [{ delta: { tool_calls: [{ index, id, type, function: { name?, arguments? } }] } }] }`.

**Error handling:** Parse failures are logged as warnings (not thrown) to avoid breaking the stream.

## getEmbeddings(texts, model)

Creates embeddings via `POST ${config.llama.url}/v1/embeddings`.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| texts | String or Array | — | Text(s) to embed |
| model | String | `'all-MiniLM-L6-v2'` | Embedding model name |

**Returns:** `{ data: [{ embedding: number[], ... }] }` — array of embedding vectors.

## healthCheck()

Simple GET request to `GET ${config.llama.url}/health` (5-second timeout) to verify Llama.cpp server connectivity.

**Returns:** Response data on success, or `null` on failure (errors are logged, not thrown). Useful for status pages and readiness checks.

## TTS Functions

### generateAudio(text, options)

Generates speech via an external Qwen3-TTS service. Requires `TTS_SERVER_URL` configured in `.env`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| text | String | Text to synthesize (max 2000 chars, longer text is truncated) |
| options | Object | Optional: `speaker`, `speakerAudio`, `language` |

**Returns:** Base64-encoded audio string (`audio_base64`).

**Throws:** Error if TTS service is not configured or unreachable. Returns HTTP error details from the TTS service (status code and detail message).

### getSpeakers()

Fetches available speakers from the TTS service at `GET ${ttsServiceUrl}/speakers`.

**Returns:** Array of speaker objects.

### initTTSClient() / shutdownTTS()

Initialize or disconnect the TTS client URL. Called during server startup/shutdown.

## Configuration

All Llama.cpp URLs are read from `config.llama.url` (from `src/config/database.js`). Timeout is set via `config.llama.timeout`. TTS configuration uses `config.tts.serverUrl` and `config.tts.timeout`.
