# LLM Server - Agent Instructions

## Architecture Overview

**Backend**: Node.js + Express (port 3000), MongoDB, Piscina worker threads for password hashing  
**Frontend**: Vue 3 + Vite, PrimeVue, Tailwind CSS (served from port 5173)  
**Integrations**: Llama.cpp inference server, Matrix messaging

## Required Setup

1. Install backend dependencies: `npm install`
2. Install frontend dependencies: `cd frontend && npm install`
3. Create Python venv for Playwright tests: `python3 -m venv venv && source venv/bin/activate`
4. Install Playwright browsers: `source venv/bin/activate && playwright install`
5. Set `.env` variables (see `.env.example`)

## Running Commands

### Backend
- Start server: `npm run dev` (auto-reload) or `npm start`
- Start worker pool: `npm run worker`
- Create admin user: `npm run seed-admin`

### Frontend
- Start dev server: `cd frontend && npm run dev -- --host`
- Build: `cd frontend && npm run build`

### Tests
- Backend tests: `npm run test` (runs `src/tests/testAll.js`)
- Frontend E2E tests: `python3 src/tests/playwright/test_frontend.py` (requires servers running)

### Full Stack
- Run both servers: `./run_all.sh` (starts backend, frontend, runs Playwright tests)
- Kill processes: `./scripts/kill.sh`

## Critical Conventions

### Database
- Uses MongoDB with connection pooling (max 10, timeout 10s)
- Connection must be established via `db.connectDB()` before any operations
- Single shared connection used across all modules

### Workers
- Password hashing offloaded to Piscina worker pool via `node-argon2`
- Message format: `{ type: 'hashPassword'|'verifyPassword', data: {...} }`

### Frontend Paths
- Import alias: `@` → `./src`
- API base URL: `/api` (proxied to backend on port 3000)
- Frontend served from `/` (index.html), API from `/api`

### Environment Variables
- `PORT=3000` (backend), `PORT=5173` (frontend default)
- `LLAMA_SERVER_URL` points to inference server
- `MONGODB_URI` must be valid for server startup

## Directory Structure

### Backend (`src/`)
```
src/
├── config/           # Configuration files
│   ├── database.js   # App config (port, env, mongodb, jwt, llama, matrix)
│   ├── db.js         # Database connection management
│   ├── rateLimiter.js
│   └── workerPool.js
├── controllers/      # Request handlers
│   ├── chatController.js
│   ├── llamaController.js
│   ├── logController.js
│   ├── matrixController.js
│   ├── monitorController.js
│   ├── promptController.js
│   ├── ragController.js
│   ├── toolController.js
│   └── userController.js
├── middleware/       # Express middleware
│   ├── auth.js
│   └── rbac.js
├── models/           # Mongoose models
│   ├── ChatSession.js
│   ├── Log.js
│   ├── MatrixMessage.js
│   ├── Prompt.js
│   ├── RAGDocument.js
│   ├── Tool.js
│   └── User.js
├── routes/           # API routes
│   ├── api.js        # Main router
│   ├── chat.js
│   ├── llama.js
│   ├── log.js
│   ├── matrix.js
│   ├── monitor.js
│   ├── prompt.js
│   ├── rag.js
│   ├── tool.js
│   └── user.js
├── scripts/          # Backend utility scripts
│   └── createAdmin.js
├── services/         # Business logic
│   ├── chatService.js
│   ├── llamaService.js
│   ├── logService.js
│   ├── matrixService.js
│   ├── promptService.js
│   ├── ragService.js
│   ├── toolService.js
│   └── userService.js
├── tests/            # Backend tests
│   └── testAll.js
├── utils/            # Utility functions
│   ├── database.js   # DB setup/cleanup utilities
│   ├── filesystem.js
│   ├── jwt.js        # JWT token utilities
│   ├── logger.js
│   └── security.js
├── workers/          # Worker threads
│   ├── argon2Worker.js
│   └── worker.js
└── server.js         # Entry point
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── assets/       # Static assets
│   ├── components/   # Vue components
│   │   ├── auth/
│   │   │   └── LoginKeypad.vue
│   │   └── layout/
│   │       ├── Header.vue
│   │       └── Sidebar.vue
│   ├── composables/  # Vue composables
│   │   └── useSidebar.js
│   ├── router/       # Vue Router
│   │   └── index.js
│   ├── stores/       # Pinia stores
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── llama.js
│   │   ├── log.js
│   │   ├── matrix.js
│   │   ├── prompt.js
│   │   ├── rag.js
│   │   ├── tool.js
│   │   └── user.js
│   ├── views/        # Page components (organized by domain)
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── chat/
│   │   │   ├── ChatView.vue
│   │   │   └── ChatHistoryView.vue
│   │   ├── home/
│   │   │   └── HomeView.vue
│   │   ├── logs/
│   │   │   └── LogsView.vue
│   │   ├── monitor/
│   │   │   └── SystemMonitorView.vue
│   │   ├── prompts/
│   │   │   └── PromptsView.vue
│   │   ├── rag/
│   │   │   ├── RAGDocumentsView.vue
│   │   │   └── RAGQueriesView.vue
│   │   └── tools/
│   │       └── ToolsView.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── public/           # Public assets
├── docs/             # Frontend documentation
└── package.json
```

### Scripts (`scripts/`)
- `install_step_1.sh` / `install_step_2.sh` - Installation scripts
- `kill.sh` - Kill running processes
- `run.sh` - Run server
- `update_llama.sh` / `update_opencode.sh` - Update scripts
- `uninstall_step_1.sh` / `uninstall_step_2.sh` - Uninstall scripts
- `models/` - Model runner scripts

### Tests (`src/tests/`)
- `testAll.js` - Backend unit tests
- `playwright/` - E2E tests
  - `test_frontend.py` - Basic frontend tests
  - `comprehensive_test.py` - Comprehensive tests
  - `test_all_frontend.py` - All frontend tests

### Test Results (`test-results/`)
- Screenshot files from test runs

### Logs (`logs/`)
- `archive/` - Archived log files

## Common Pitfalls

1. **MongoDB timeout**: Server fails to start if connection times out; reduce timeout in `.env` if network is slow
2. **Frontend CORS**: Backend CORS configured for `FRONTEND_URL` (default: `http://localhost:3000`); mismatch causes 403
3. **Playwright tests**: Must run `./run_all.sh` in order; backend must be ready before frontend
4. **Worker failures**: Heavy password hashing may block main thread if Piscina not used
