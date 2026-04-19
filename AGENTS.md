# LLM Server - Agent Instructions

## Architecture

**Backend**: Node.js + Express (port 3000), MongoDB via Mongoose, Piscina worker threads  
**Frontend**: Vue 3 + Vite, PrimeVue (Aura theme), Tailwind CSS (port 5173)  
**Integrations**: Llama.cpp inference server, Matrix messaging

Node >= 24.12.0 required. No lint/typecheck scripts — verification is manual.

## Setup

```bash
npm install && cd frontend && npm install && cd ..
# MongoDB must be running before server starts
npm run seed-admin    # creates admin/admin123 (password: admin123)
```

## Commands

```bash
npm run dev          # backend (node --watch, auto-reloads)
npm run worker       # Piscina worker thread pool (foreground)
npm start            # backend without watch
npm run test         # runs node src/tests/testAll.js (model-level tests, needs MongoDB)

cd frontend && npm run dev   # frontend dev server (vite --host by default)
cd frontend && npm run build # production build

python3 src/tests/playwright/test_frontend.py   # E2E tests (needs both servers running)
./run_all.sh                           # full stack: backend + frontend + Playwright
```

## Gotchas

- **argon2 v1.0.0** — `argon2.verify()` takes `{ hash, password }` object, NOT two arguments. Use `User.hashPassword()` and `user.checkPassword()` for all password operations. The worker thread also uses the object form for `verifyPassword` type requests.
- **All API responses** wrap data in `{ success: true, data: ... }`. Pinia stores must access `response.data.data`, never `response.data` directly.
- **Chat routes** use both `/:id` and `/:sessionId` aliases. Controllers must handle `req.params.sessionId || req.params.id`.
- **All services** (prompt, tool, log, etc.) use Mongoose models — never raw `db.collection()`.
- **User object** has `roles` (array), not `role`. Header displays `user?.roles?.[0]`.
- **Log store** has separate `pagination` state, not nested on `logs`.
- **MongoDB** must be running before `npm run dev` starts, or the server exits with `process.exit(1)`.
- **CORS** defaults to `FRONTEND_URL=http://localhost:5173`; mismatch causes 403.
- **Auth routes** (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`) are handled by `userController`, not a separate auth controller.
- **User profile** endpoints are at `/api/users/me` (GET/PUT/DELETE), protected by `authMiddleware`. User CRUD (`/api/users/*`) requires `rbac.requireAdmin`.
- **Frontend axios** has two interceptors: `apiClient` in `axios.js` (Pinia-based token) and a separate one in `main.js` (localStorage-based). Both send Bearer tokens.
- **401/403** in frontend auto-redirects to `/login` via axios response interceptor.
- **Tool execution** for custom tools is `POST /api/tools/:id/call` (not `/execute`). Builtin tools (bash, read, write, glob, grep, question, todo, skill) are registered via `src/tool/index.js`.
- **Chat routes** are mounted under both `/api/chat` and `/api/chats` in `api.js`.
- `.env` is committed to the repo — contains default JWT secret and MongoDB URI.

## Entry Points

- Backend: `src/server.js` → `src/routes/api.js` → route files → controllers → services → models
- Frontend: `frontend/src/main.js` → `App.vue` → views, stores, components
- Worker pool: `src/workers/worker.js` (argon2 hashing, bash execution)

## File Layout

```
src/
├── config/       database.js, db.js, rateLimiter.js, workerPool.js
├── controllers/  chat, llama, log, matrix, monitor, prompt, rag, skill, tool, user
├── middleware/   auth.js, rbac.js (authorize, requireAdmin, requireSystem), validation.js
├── models/       ChatSession, Log, MatrixMessage, Prompt, RAGDocument, Tool, ToolCall, User
├── routes/       api.js (mounts all sub-routes), auth, user, chat, rag, prompt, tool, log, matrix, llama, monitor, skill
├── services/     chatService, llamaService, logService, matrixService, promptService, ragService, skillService, toolService, userService
├── tool/         bash, glob, grep, index.js, question, read, registry, skill, todo, tool.js, truncate, write
├── workers/      argon2Worker.js, worker.js
└── scripts/      createAdmin.js

frontend/src/
├── stores/       auth, chat, debug, llama, log, matrix, prompt, rag, skill, tool, user
├── views/        auth/, chat/, debug/, home/, logs/, monitor/, prompts/, rag/, skills/, tools/
├── components/   auth/, layout/ (Header, Sidebar)
├── router/       index.js (auth guard redirects unauthenticated to /login)
└── axios.js      apiClient with Bearer token interceptor (401/403 → login redirect)
```

## Documentation

- `docs/` — comprehensive documentation with diagrams and tag-based navigation
- `docs/index.md` — main index
- `docs/tags-index.md` — tag-based navigation organized by category
- `docs/CHANGELOG.md` — update with timestamps for bug fixes and new features

## Commit & Push

When asked to commit and push, you **MUST** update `docs/CHANGELOG.md` first, then commit all changes including the changelog update.
