# LLM Server - Agent Instructions

## Architecture

**Backend**: Node.js + Express (port 3000), MariaDB via Knex, Qdrant (vector store for RAG), Piscina worker threads  
**Frontend**: Vue 3 + Vite, PrimeVue (Aura theme), Tailwind CSS (port 5173)  
**Integrations**: Llama.cpp inference server, Matrix messaging

Node >= 24.12.0 required. No lint/typecheck scripts — verification is manual.

## Setup

```bash
npm install && cd frontend && npm install && cd ..
# MariaDB and Qdrant must be running before server starts
npm run seed-admin    # creates admin/admin123 (password: admin123)
npm run seed-config   # seeds application settings into configs table
```

## Commands

```bash
npm run dev          # backend (node --watch, auto-reloads)
npm run worker       # Piscina worker thread pool (foreground)
npm start            # backend without watch
npm run test         # runs node src/tests/testAll.js (model-level tests, needs MariaDB + Qdrant)

cd frontend && npm run dev   # frontend dev server (vite --host by default)
cd frontend && npm run build # production build

python3 src/tests/playwright/test_frontend.py   # E2E tests (needs both servers running)
./run_all.sh                           # full stack: backend + frontend + Playwright
```

## Gotchas

- **argon2 v1.0.0** — `argon2.verify()` takes `{ hash, password }` object, NOT two arguments. Use `User.hashPassword()` and `user.checkPassword()` for all password operations. The worker thread also uses the object form for `verifyPassword` type requests.
- **All API responses** wrap data in `{ success: true, data: ... }`. Pinia stores must access `response.data.data`, never `response.data` directly.
- **Chat routes** use both `/:id` and `/:sessionId` aliases. Controllers must handle `req.params.sessionId || req.params.id`.
- **All services** (prompt, tool, log, etc.) use Knex queries — never raw MongoDB driver. JSON columns store arrays/objects as serialized strings.
- **User object** has `roles` (array), not `role`. Header displays `user?.roles?.[0]`.
- **Log store** has separate `pagination` state, not nested on `logs`.
- **MariaDB** must be running before `npm run dev` starts, or the server exits with `process.exit(1)`.
- **Qdrant** is used for RAG vector search — chunks are stored as points with embedding vectors and metadata payloads. Document metadata stays in MariaDB.
- **CORS** defaults to `FRONTEND_URL=http://localhost:5173`; mismatch causes 403.
- **Auth routes** (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`) are handled by `userController`, not a separate auth controller.
- **User profile** endpoints are at `/api/users/me` (GET/PUT/DELETE), protected by `authMiddleware`. User CRUD (`/api/users/*`) requires `rbac.requireAdmin`.
- **Frontend axios** has two interceptors: `apiClient` in `axios.js` (Pinia-based token) and a separate one in `main.js` (localStorage-based). Both send Bearer tokens.
- **401/403** in frontend auto-redirects to `/login` via axios response interceptor.
- **Tool execution** for custom tools is `POST /api/tools/:id/call` (not `/execute`). Builtin tools (bash, read, write, glob, grep, question, todo, skill) are registered via `src/tool/index.js`.
- **Chat routes** are mounted under both `/api/chat` and `/api/chats` in `api.js`.
- Do not commit actual environment secrets. Use `.env.example` as a template and ensure `.env` is added to `.gitignore` in all environments.
- **Qwen3-TTS** runs as an external HTTP service (not spawned by the backend). Configure `TTS_SERVER_URL` in `.env`. The service requires GPU and Python 3.9+. Reference implementation at `integrations/qwen3-tts/`.

## Entry Points

- Backend: `src/server.js` → `src/routes/api.js` → route files → controllers → services → database (Knex)
- Frontend: `frontend/src/main.js` → `App.vue` → views, stores, components
- Worker pool: `src/workers/worker.js` (argon2 hashing, bash execution)

## File Layout

```
src/
├── config/       database.js, mariadb.js, db.js, rateLimiter.js, workerPool.js
├── controllers/  chat, llama, log, matrix, monitor, prompt, rag, skill, tool, user, documentGroup, memory
├── middleware/   auth.js, rbac.js (authorize, requireAdmin, requireSystem), validation.js
├── db/           schema.js (table definitions), qdrant.js (vector client)
├── routes/       api.js (mounts all sub-routes), auth, user, chat, rag, prompt, tool, log, matrix, llama, monitor, skill, roles, documentGroups, memory, system, config
├── services/     chatService, llamaService, logService, matrixService, promptService, ragService, skillService, toolService, userService, roleService, documentGroupService, memoryManager
├── tool/         bash, glob, grep, index.js, question, read, registry, skill, todo, tool.js, truncate, write
├── workers/      argon2Worker.js, worker.js
└── scripts/      createAdmin.js, seedConfig.js

frontend/src/
├── stores/       auth, chat, debug, llama, log, matrix, prompt, rag, skill, tool, user
├── views/        auth/, chat/, debug/, home/, logs/, monitor/, prompts/, rag/, skills/, tools/
├── components/   auth/, layout/ (Header, Sidebar)
├── router/       index.js (auth guard redirects unauthenticated to /login)
└── axios.js      apiClient with Bearer token interceptor (401/403 → login redirect)
```

## Documentation

All documentation is in `docs/` with diagrams, tags, and wiki-style cross-references.

### Index & Navigation
- `docs/index.md` — main index with categorized links and summaries
- `docs/tags-index.md` — tag-based navigation organized by category (auth, chat, rag, memory, etc.)

### Feature Documentation (15 pages)
- `docs/features/authentication.md` — login, registration, JWT, RBAC
- `docs/features/user-management.md` — CRUD, profiles, role assignment
- `docs/features/chat-sessions.md` — sessions, messages, streaming, tool calls
- `docs/features/llm-integration.md` — Llama.cpp inference, embeddings
- `docs/features/rag-system.md` — document processing, chunking, semantic search
- `docs/features/prompt-management.md` — prompt templates with variables
- `docs/features/tool-support.md` — custom tools, Zod validation, builtin tools
- `docs/features/system-monitoring.md` — logs, health checks, performance
- `docs/features/matrix-integration.md` — Matrix bot, webhooks, room chat
- `docs/features/audio-generation.md` — TTS via Qwen3-TTS external service
- `docs/features/config-management.md` — application settings CRUD
- `docs/features/role-management.md` — role CRUD with cascade deletion
- `docs/features/document-groups.md` — cross-user document sharing with permissions
- `docs/features/persistent-memory.md` — three-layer memory (episodic, semantic, procedural)
- `docs/features/citation-system.md` — RAG source attribution

### Component Documentation (3 pages)
- `docs/components/frontend-components.md` — Vue 3 components
- `docs/components/pinia-stores.md` — Pinia state management stores
- `docs/components/middleware.md` — auth, RBAC, rate limiting middleware

### Architecture Documentation (5 pages)
- `docs/architecture/system-architecture.md` — system design overview
- `docs/architecture/database-schema.md` — MariaDB tables and Qdrant collections
- `docs/architecture/worker-threads.md` — Piscina pool implementation
- `docs/architecture/security-design.md` — password hashing, JWT, validation
- `docs/architecture/deep-dive.md` — complete request flow walkthrough

### API Reference (3 pages)
- `docs/api/api-endpoints.md` — complete REST API specification
- `docs/api/request-response-formats.md` — standard response patterns
- `docs/api/error-handling.md` — error codes and strategies

### Function Documentation (6 pages)
- `docs/functions/chat-service-functions.md` — all chatService functions
- `docs/functions/llama-service-functions.md` — all llamaService functions
- `docs/functions/tool-service-functions.md` — tool CRUD, registry, execution
- `docs/functions/document-parser-functions.md` — parsePDF, parseDOCX, parseXLSX, etc.
- `docs/functions/skill-service-functions.md` — skill discovery and CRUD
- `docs/functions/document-group-functions.md` — group CRUD, member management

### Technical Reference (5 pages)
- `docs/technical/configuration-guide.md` — environment variables and setup
- `docs/technical/deployment-guide.md` — Docker and production deployment
- `docs/technical/performance-guide.md` — optimization strategies
- `docs/technical/troubleshooting.md` — common issues and solutions
- `docs/technical/platform-info.md` — requirements, dependencies, port config

### QA & Examples (2 pages)
- `docs/qa/api-testing-examples.md` — curl test examples for all endpoints
- `docs/qa/practical-examples.md` — real-world usage scenarios with code

### Llama.cpp Reference
- `docs/llama.cpp_docs/` — Llama.cpp server documentation (server, cli, quantize, build)

### Changelog
- `docs/CHANGELOG.md` — update with timestamps for bug fixes and new features

## Commit & Push

When asked to commit and push, you **MUST** update `docs/CHANGELOG.md` first, then commit all changes including the changelog update.
