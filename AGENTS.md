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
- Frontend E2E tests: `python3 test_frontend.py` (requires servers running)

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

## Common Pitfalls

1. **MongoDB timeout**: Server fails to start if connection times out; reduce timeout in `.env` if network is slow
2. **Frontend CORS**: Backend CORS configured for `FRONTEND_URL` (default: `http://localhost:3000`); mismatch causes 403
3. **Playwright tests**: Must run `./run_all.sh` in order; backend must be ready before frontend
4. **Worker failures**: Heavy password hashing may block main thread if Piscina not used

## Directory Ownership

- `src/`: Backend server, controllers, models, routes, workers
- `frontend/`: Vue SPA (self-contained with its own node_modules)
- `scripts/`: Model management scripts for llama.cpp
- `test_frontend.py`: Playwright E2E tests
