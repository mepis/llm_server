tags: [technical, platform, configuration, requirements]

# Platform Information

This document covers platform requirements, dependencies, port configuration, environment variables, data flows, and performance characteristics for the LLM Server.

---

## Platform Requirements

### Runtime

| Requirement | Minimum Version | Notes |
|------------|-----------------|-------|
| Node.js | 24.12.0 | Required for ES2023+ features and Piscina compatibility |
| MongoDB | 6.0+ | Running instance required before backend starts |
| Llama.cpp server | Any | External HTTP server, port configurable via `LLAMA_SERVER_URL` |
| TTS server | Any | External service, configured via `TTS_SERVER_URL`. Requires GPU + Python 3.9+ for Qwen3-TTS |

### MongoDB

Must be running before `npm run dev` starts, or the backend exits with `process.exit(1)`. Connection is established at startup via `src/config/db.js`.

### Llama.cpp Server

Handles all LLM inference and embedding generation. The backend communicates with it via HTTP REST API (`/v1/chat/completions`, `/v1/embeddings`). Model definitions are cached locally for 60 seconds to reduce repeated requests.

---

## Dependency Matrix

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.21.0 | HTTP server and routing |
| mongoose | ^8.8.0 | MongoDB ODM |
| jsonwebtoken | ^9.0.2 | JWT token generation and verification |
| node-argon2 | ^1.0.0 | Password hashing (argon2id). Uses object form: `argon2.verify({ hash, password })` |
| piscina | ^4.7.0 | Worker thread pool for CPU-intensive tasks |
| winston | ^3.17.0 | Structured logging |
| cors | ^2.8.5 | Cross-origin resource sharing configuration |
| multer | ^2.0.0 | Multipart form-data file upload handling |
| pdf-parse | ^1.1.4 | PDF document text extraction for RAG |
| mammoth | ^1.12.0 | DOCX document text extraction for RAG |
| xlsx | ^0.18.5 | Excel spreadsheet text extraction for RAG |
| matrix-js-sdk | ^39.2.0 | Matrix bot client for messaging integration |
| zod | ^3.23.0 | Schema validation for tool parameters and API input |
| gray-matter | ^4.0.3 | YAML frontmatter parsing for SKILL.md files |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vue | ^3.5.30 | Composition API-based frontend framework |
| pinia | ^2.3.1 | State management (reactive stores) |
| primevue | ^4.5.4 | UI component library (Aura theme) |
| tailwindcss | ^4.2.2 | Utility-first CSS framework |
| vite | ^8.0.1 | Build tool and dev server |

---

## Port Configuration

| Service | Default Port | Environment Variable | Notes |
|---------|-------------|---------------------|-------|
| Backend API | 3000 | `PORT` | Express.js server |
| Frontend (dev) | 5173 | — | Vite dev server (`--host` flag by default) |
| Llama.cpp | 8082 | `LLAMA_SERVER_URL` | External inference server. URL format: `http://host:port` |
| TTS Server | Configurable | `TTS_SERVER_URL` | External text-to-speech service |
| MongoDB | — | `MONGODB_URI` | Connection string, not a port the app manages |

### CORS Configuration

The frontend URL is controlled by `FRONTEND_URL` (default: `http://localhost:5173`). Mismatch causes 403 errors on API requests.

---

## Environment Variables Reference

Complete list of all `.env` variables with descriptions and defaults.

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Backend HTTP server port |
| `MONGODB_URI` | Yes | — | MongoDB connection string (e.g., `mongodb://localhost:27017/llmserver`) |
| `JWT_SECRET` | Yes | — | Secret key for JWT token signing. Must be a strong random string |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for CORS configuration |

### Llama.cpp Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLAMA_SERVER_URL` | Yes | — | Full URL to Llama.cpp inference server (e.g., `http://localhost:8082`) |
| `LLAMA_TIMEOUT` | No | 120000 | Request timeout in milliseconds for Llama.cpp calls |

### TTS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TTS_SERVER_URL` | No | — | Full URL to external TTS server. Qwen3-TTS requires GPU and Python 3.9+ |

### Matrix Bot Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MATRIX_BOT_ENABLED` | No | `false` | Enable or disable Matrix bot integration |
| `MATRIX_HOMEPREFIX` | If enabled | — | Matrix homeserver URL (e.g., `https://matrix.org`) |
| `MATRIX_USER_ID` | If enabled | — | Matrix bot user ID (e.g., `@llmbot:matrix.org`) |
| `MATRIX_PASSWORD` | If enabled | — | Matrix bot password |

### Memory Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MEMORY_EXTRACTION_THRESHOLD` | No | `10` | Number of messages in a session before automatic memory extraction triggers |

---

## Data Flow Diagrams

### User Registration Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ Express.js   │────▶│ Input        │────▶│ Piscina      │
│          │     │ /api/auth/   │     │ Validation   │     │ Worker       │
│ POST     │     │ register     │     │ (express-    │     │ (argon2)     │
│          │     │              │     │ validator)   │     │              │
└──────────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
                        │                     │                     │
                        │                     │                     ▼
                        │                     │              ┌──────────────┐
                        │                     │              │ argon2id     │
                        │                     │              │ hash(password)│
                        │                     │              └──────┬───────┘
                        │                     │                     │
                        │                     │                     ▼
                        │                     │              ┌──────────────┐
                        │                     │              │ MongoDB      │
                        │                     │              │ User model   │
                        │                     │              │ (hash, not   │
                        │                     │              │  plaintext)  │
                        │                     │              └──────┬───────┘
                        │                     │                     │
                        │                     ▼                     │
                        │              ┌──────────────┐             │
                        │              │ Service      │◀────────────┘
                        │              │ creates user │
                        │              │ with hash    │
                        │              └──────┬───────┘
                        │                     │
                        ▼                     │
                ┌──────────────┐             │
                │ Response:    │◀────────────┘
                │ { success,   │
                │   data:     │
                │   {token,   │
                │    user} }  │
                └──────────────┘
```

### Chat Request Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ Express.js   │────▶│ authMiddleware│
│          │     │ /api/chat/   │     │ (JWT verify) │
│ POST     │     │ :id/llm      │     │              │
│          │     │              │     │ Sets req.user│
└──────────┘     └──────┬───────┘     └──────┬───────┘
                        │                     │
                        ▼                     ▼
                ┌──────────────┐     ┌──────────────┐
                │ Rate         │     │ chatController│
                │ Limiter      │     │ calls        │
                │ (100/15min)  │     │ chatService  │
                └──────┬───────┘     │ runLoop()   │
                       │             └──────┬──────┘
                       │                    │
                       ▼                    ▼
               ┌──────────────┐     ┌──────────────┐
               │  Allowed?    │     │ Fetch session│
               │  Yes:        │     │ messages     │
               │  Continue    │     │              │
               └──────────────┘     └──────┬───────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Build system     │
                                  │ prompt:          │
                                  │ memories + RAG   │
                                  │ + skills         │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ llamaService     │
                                  │ → Llama.cpp HTTP │
                                  │ /v1/chat/        │
                                  │ completions      │
                                  └────────┬─────────┘
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                              ▼            ▼            ▼
                       ┌──────────┐ ┌──────────┐ ┌──────────┐
                       │ Content  │ │ Tool     │ │ Error    │
                       │ (finish) │ │ calls    │ │          │
                       └────┬─────┘ └────┬─────┘ └──────────┘
                              │          │
                              ▼          ▼
                       ┌──────────┐ ┌──────────────┐
                       │ Save to  │ │ executeTool- │
                       │ MongoDB  │ │ Call()       │
                       └──────────┘ └──────┬───────┘
                                          │
                                   ┌──────┴───────┐
                                   │ Loop back to │
                                   │ Llama.cpp    │
                                   │ (max turns)  │
                                   └──────────────┘

                              Final result → SSE stream or response body
```

### File Upload Flow (RAG)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ Express.js   │────▶│ Multer       │
│          │     │ /api/rag/    │     │ (file parse) │
│ POST     │     │ documents    │     │              │
│          │     │ (multipart)  │     │              │
└──────────┘     └──────┬───────┘     └──────┬───────┘
                        │                     │
                        ▼                     ▼
                ┌──────────────┐     ┌──────────────┐
                │ Auth check   │     │ File type    │
                │ (user owns   │     │ validation:  │
                │  this doc)   │     │ pdf/docx/xlsx│
                └──────┬───────┘     └──────┬───────┘
                        │                     │
                        ▼                     ▼
                 ┌──────────────────────────────────┐
                 │ Document Service                  │
                 │                                   │
                 │ 1. Save file metadata to MongoDB  │
                 │    (RAGDocument model)            │
                 │ 2. Extract text based on type:    │
                 │    pdf-parse for PDF              │
                 │    mammoth for DOCX               │
                 │    xlsx for Excel                 │
                 │ 3. Chunk extracted text           │
                 │ 4. Generate embeddings via        │
                 │    Llama.cpp /v1/embeddings       │
                 │ 5. Store chunks with embeddings   │
                 │    in RAGDocument.chunks array    │
                 └──────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ Response:    │
                │ { success,   │
                │   data:     │
                │   doc_id }   │
                └──────────────┘
```

---

## Performance Characteristics

### Caching

| Cache | TTL | Details |
|-------|-----|---------|
| Model definitions (from Llama.cpp) | 60 seconds | Stored in a Map; avoids repeated `/v1/models` calls |
| Skills (SKILL.md files) | 30 seconds | File system cached; reloaded on cache expiry |

### Worker Pool

| Parameter | Value | Notes |
|-----------|-------|-------|
| Thread count | 2–4 | Configurable in `src/config/workerPool.js` |
| Idle timeout | 30 seconds | Threads terminate after idle period |
| Max tasks per worker | 1000 | Workers recycle after this many tasks |

### Rate Limits

| Limiter | Window | Max Requests | Endpoint |
|---------|--------|-------------|----------|
| API general | 15 minutes | 100 | All authenticated endpoints |
| Auth (login) | 15 minutes | 5 | `/api/auth/login` |
| Registration | 24 hours | 3 | `/api/auth/register` |

### Memory Extraction

| Parameter | Default | Notes |
|-----------|---------|-------|
| Threshold | 10 messages | Triggers auto-extraction when session message count reaches this |
| Configurable via | `MEMORY_EXTRACTION_THRESHOLD` env var | Set to `0` to disable, or increase for larger sessions |

### Context Budget

Total memory + RAG context injected into system prompt is capped at **300 tokens**:

| Layer | Max Entries | Approx. Tokens | Priority |
|-------|-------------|----------------|----------|
| Procedural | 10 | ~100 | 1st (always included) |
| Semantic | 5 | ~150 | 2nd (by relevance) |
| Episodic | 3 | ~50 | 3rd (oldest-first trimmed) |

---

## Tags

- `technical` - Technical reference
- `platform` - Platform requirements
- `configuration` - Environment and setup
- `dependencies` - Package dependencies
- `performance` - Performance characteristics
- `architecture` - System architecture details

---

## Related Documentation

- [Configuration Guide](./configuration-guide.md) - Setup and configuration walkthrough
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions
- [Performance Guide](./performance-guide.md) - Optimization and tuning
- [Troubleshooting](./troubleshooting.md) - Common issues and fixes
- [Architecture Deep Dive](../architecture/deep-dive.md) - System architecture details
- [Security Design](../architecture/security-design.md) - Security architecture
- [Worker Threads](../architecture/worker-threads.md) - Piscina worker pool details
