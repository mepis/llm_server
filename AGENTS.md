# LLM Server - Agent Instructions

## Architecture

**Backend**: Node.js + Express (port 3000), MongoDB via Mongoose, Piscina worker threads  
**Frontend**: Vue 3 + Vite, PrimeVue, Tailwind CSS (port 5173)  
**Integrations**: Llama.cpp inference server, Matrix messaging

## Setup

```bash
npm install && cd frontend && npm install && cd ..
# MongoDB must be running before server starts
npm run seed-admin    # creates admin/admin123
```

## Commands

```bash
npm run dev          # backend (node --watch, auto-reloads)
npm run worker       # Piscina worker thread pool
npm run seed-admin   # create admin user
npm start            # backend without watch

cd frontend && npm run dev -- --host   # frontend dev server
cd frontend && npm run build           # production build

npm run test                           # backend tests
python3 src/tests/playwright/test_frontend.py   # E2E tests (requires servers running)
./run_all.sh                           # full stack: backend + frontend + Playwright
./scripts/kill.sh                      # kill running processes
```

## Gotchas

- **argon2 v1.0.0** — `argon2.verify()` takes `{ hash, password }` object, NOT two arguments. Use `User.hashPassword()` and `user.checkPassword()` for all password operations.
- **All API responses** wrap data in `{ success: true, data: ... }`. Pinia stores must access `response.data.data`, never `response.data` directly.
- **Chat routes** use both `/:id` and `/:sessionId` aliases. Controllers must handle `req.params.sessionId || req.params.id`.
- **All services** (prompt, tool, log, etc.) use Mongoose models — never raw `db.collection()`.
- **User object** has `roles` (array), not `role`. Header displays `user?.roles?.[0]`.
- **Log store** has separate `pagination` state, not nested on `logs`.
- **MongoDB** must be running before `npm run dev` starts, or the server exits.
- **CORS** defaults to `FRONTEND_URL=http://localhost:5173`; mismatch causes 403.

## Entry Points

- Backend: `src/server.js` → `src/routes/api.js` → route files → controllers → services → models
- Frontend: `frontend/src/main.js` → `App.vue` → views, stores, components
- Worker pool: `src/workers/worker.js` (argon2 hashing)

## File Layout

```
src/
├── config/       db.js, database.js, rateLimiter.js, workerPool.js
├── controllers/  one per domain (chat, llama, log, matrix, prompt, rag, tool, user)
├── models/       Mongoose schemas — all services use these
├── routes/       express routers, each mounted in api.js
├── services/     business logic — call models, never raw db
├── middleware/   auth.js, rbac.js
├── workers/      argon2Worker.js, worker.js (Piscina)
└── scripts/      createAdmin.js

frontend/src/
├── stores/       Pinia stores — all access response.data.data
├── views/        page components
├── components/   Header.vue, Sidebar.vue, auth/
├── router/       index.js
└── axios.js      apiClient with Bearer token interceptor
```

## Changelog

Always update `docs/CHANGELOG.md` with timestamps for bug fixes and new features.

## Commit & Push

When asked to commit and push, you **MUST** update the changelog first, then commit all changes including the changelog update.
