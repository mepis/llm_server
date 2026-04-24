tags: [architecture, system-design, backend, frontend]

# Architecture Deep Dive

This document provides a comprehensive deep-dive into the LLM Server architecture, covering all layers, request flows, worker threads, database relationships, security, and streaming.

---

## System Architecture Overview

The LLM Server is a full-stack application composed of three major layers: a Vue 3 frontend (port 5173), an Express.js backend API server (port 3000), and external services for inference (Llama.cpp) and text-to-speech (TTS). MongoDB stores all persistent data.

### Complete Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                             │
│                                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐           │
│  │   Web App    │    │  Matrix Bot  │    │  External API Clients   │           │
│  │  (Vue 3)     │    │(matrix-js-sdk)│    │  (curl, Postman, etc.) │           │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘           │
│       │                    │                            │                       │
│       └────────────────────┴────────────────────────────┘                       │
│                           │                                                      │
│                     HTTPS / WS                                                     │
└───────────────────────────┼───────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                                         │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    Express.js Server (Port 3000)                         │   │
│  │                                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐           │   │
│  │  │ Auth          │  │ RBAC          │  │ Rate Limiter      │           │   │
│  │  │ Middleware    │  │ Middleware    │  │                   │           │   │
│  │  │ (JWT verify)  │  │ (roles check) │  │ API: 100/15min    │           │   │
│  │  └───────────────┘  └───────────────┘  │ Auth: 5/15min     │           │   │
│  │                                       │ Reg: 3/day          │           │   │
│  │                                       └───────────────────┘           │   │
│  │                                                                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐           │   │
│  │  │ CORS          │  │ Input         │  │ Multer (file      │           │   │
│  │  │               │  │ Validation    │  │ upload)             │           │   │
│  │  └───────────────┘  └───────────────┘  └───────────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                      │
│              ┌────────────┼────────────┐                                         │
│              ▼            ▼            ▼                                         │
└──────────────┼────────────┼────────────┼─────────────────────────────────────────┘
               │            │            │
               ▼            ▼            ▼
┌──────────────────────────┼───────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                                         │
│                                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ User     │  │ Chat     │  │ RAG      │  │ Llama    │  │ Prompt   │         │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Tool     │  │ Matrix   │  │ Log      │  │ Monitor  │  │ Skill    │         │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                        Controllers                                   │       │
│  │                                                                      │       │
│  │  userController  chatController  llamaController  logController      │       │
│  │  matrixController monitorController promptController ragController   │       │
│  │  skillController toolController                                      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                        Middleware                                    │       │
│  │                                                                      │       │
│  │  authMiddleware (JWT)  rbacMiddleware (authorize, requireAdmin,      │       │
│  │    requireSystem)  validationMiddleware  rateLimiter                  │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────────┘
               │            │            │
               ▼            ▼            ▼
┌──────────────┼────────────┼────────────┼─────────────────────────────────────────┐
│              │            │            │                                          │
│  ┌───────────┴──┐  ┌─────┴──────────┐ └──────────┐                                │
│  │  Piscina     │  │  MongoDB       │             │                                │
│  │  Worker      │  │  Database      │             │                                │
│  │  Pool        │  │                │             │                                │
│  │              │  │ ┌────────────┐ │             │                                │
│  │  Thread 1    │  │ │ User       │ │             │                                │
│  │  (argon2/bash)│ │ │ ChatSession│ │             │                                │
│  │              │  │ │ RAGDocument│ │             │                                │
│  │  Thread 2    │  │ │ Prompt     │ │             │                                │
│  │              │  │ │ Tool       │ │             │                                │
│  │  Thread 3    │  │ │ Log        │ │             │                                │
│  │              │  │ │ MatrixMsg  │ │             │                                │
│  │  Thread 4    │  │ │ ToolCall   │ │             │                                │
│  │              │  │ │ UserMemory │ │             │                                │
│  └──────────────┘  │ │ DocGroup   │ │             │                                │
│                    │ └────────────┘ │             │                                │
│                    └────────────────┘             │                                │
│                                                    ▼                                │
│                                          ┌─────────────────┐                       │
│                                          │ External Services│                      │
│                                          │                  │                      │
│                                          │ Llama.cpp (8082)│                      │
│                                          │ TTS Server       │                      │
│                                          └─────────────────┘                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Layer Summary

| Layer | Technology | Port | Responsibility |
|-------|-----------|------|----------------|
| Client | Vue 3 + PrimeVue + Tailwind CSS | 5173 (dev) | UI, Pinia state, SSE streaming |
| API Gateway | Express.js | 3000 | Routing, middleware chain |
| Business Logic | Node.js services | — | Domain logic per feature |
| Worker Pool | Piscina (4 threads) | — | CPU-intensive tasks |
| Data Store | MongoDB + Mongoose | configurable | All persistent data |
| Inference | Llama.cpp server | 8082 (default) | Model inference, embeddings |
| TTS | Qwen3-TTS external | configurable (env) | Text-to-speech conversion |

---

## Request Flow Deep Dive

### Chat Request: Step-by-Step

This is the primary user-facing flow — sending a message to an LLM and receiving a response with potential tool calls.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Chat Request Full Flow                                        │
│                                                                                  │
│  ┌──────────┐                                                                    │
│  │  Client  │  POST /api/chat/:id/llm or /api/chat/:sessionId/llm               │
│  │          │  Headers: Authorization: Bearer <token>                            │
│  │          │  Body: { content: "Hello", model?, stream? }                      │
│  └────┬─────┘                                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────┐                                                                │
│  │ Step 1:      │                                                                │
│  │ authMiddleware│  Extracts JWT from Authorization header                        │
│  │              │  Calls jwt.verify(token, JWT_SECRET)                           │
│  │              │  Sets req.user = decoded payload (user_id, roles, username)    │
│  │              │  If invalid/missing → 401 "No token provided"                  │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 2:      │                                                                │
│  │ chatController│  Receives request, extracts sessionId from                     │
│  │              │  req.params.sessionId || req.params.id                         │
│  │              │  Calls chatService.runLoop(sessionId, messageContent)           │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 3:      │                                                                │
│  │ chatService  │  Finds ChatSession by ID                                       │
│  │ runLoop()    │  Fetches all messages from session                             │
│  │              │  Retrieves user memories (episodic/semantic/procedural)        │
│  │              │  Searches RAG documents for context                            │
│  │              │  Loads active skills                                             │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 4:      │                                                                │
│  │ Build System │  Constructs final system prompt:                               │
│  │ Prompt       │  <user_preferences> (procedural memory)                        │
│  │              │  <known_facts> (semantic memory)                               │
│  │              │  <recent_topics> (episodic memory)                             │
│  │              │  <rag_context> (retrieved chunks)                              │
│  │              │  <skills> (injected SKILL.md content)                          │
│  │              │  Default instructions                                          │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 5:      │                                                                │
│  │ llamaService │  Sends request to Llama.cpp server:                            │
│  │              │  POST /v1/chat/completions                                     │
│  │              │  Body: { model, messages[], tools[] }                          │
│  │              │  Model cached for 60 seconds (avoids repeated fetch)            │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 6:      │                                                                │
│  │ LLM responds │  Returns one of:                                               │
│  │              │  A) content string (finish)                                    │
│  │              │  B) tool_calls array (continue)                                │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│    ┌────┴────┐                                                                   │
│    │         │                                                                    │
│    ▼          ▼                                                                    │
│ ┌────────┐ ┌──────────────────┐                                                   │
│ │ Content│ │tool_calls? NO    │ → Go to Step 9 (save result)                     │
│ │only    │ └──────────────────┘                                                   │
│ │        │                                                                        │
│ ▼         ┌──────────────────┐                                                    │
│ ┌────────┐ │tool_calls? YES   │                                                   │
│ │ Save   │ └──────────────────┘ → Go to Step 7                                    │
│ │ result │                                                                        │
│ │ & exit │                                                                        │
│ └────────┘                                                                        │
│                                                                                  │
│  ┌──────────────┐                                                                │
│  │ Step 7:      │                                                                │
│  │ executeTool- │  For each tool_call in tool_calls:                              │
│  │ Call()       │  Look up Tool by name/ID                                       │
│  │              │  Validate parameters with Zod schema                           │
│  │              │  Execute via worker thread (bash) or eval (custom JS)          │
│  │              │  Capture result string                                         │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 8:      │                                                                │
│  │ Loop back    │  Append tool results as assistant messages                     │
│  │ (Step 5+)    │  Check MAX_TOOL_TURNS limit                                    │
│  │              │  If limit reached → go to Step 9                               │
│  │              │  Otherwise → send back to Llama.cpp with results               │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 9:      │                                                                │
│  │ Save result  │  Persist final response to ChatSession messages array          │
│  │              │  If session has no subject, auto-generate one from content     │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 10:     │                                                                │
│  │ Memory       │  Count messages in session                                     │
│  │ extraction   │  If >= MEMORY_EXTRACTION_THRESHOLD (default 10):               │
│  │              │    - Filter to user/assistant messages only                    │
│  │              │    - Extract episodic, semantic, procedural memories           │
│  │              │    - Apply PII redaction                                       │
│  │              │    - Store in UserMemory collection                            │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │ Step 11:     │                                                                │
│  │ Return to    │  { success: true, data: { content, tokens_used, ... } }       │
│  │ Client       │  If streaming → SSE events instead                            │
│  └──────────────┘                                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Flow Details

**Route aliases:** Chat routes accept both `/:id` and `/:sessionId`. Controllers use `req.params.sessionId || req.params.id` to handle either.

**Memory context budget:** Total memory + RAG context is capped at 300 tokens per request. Priority order: procedural → semantic → episodic.

**Model caching:** Retrieved model definitions are cached for 60 seconds in a Map to avoid repeated Llama.cpp calls.

**Skill discovery:** Active skills are discovered from the `skills/` directory, their `SKILL.md` files parsed with `gray-matter`, and injected into the system prompt.

---

## Worker Thread Architecture

The worker thread pool uses Piscina to offload CPU-intensive tasks from the main Express.js thread, keeping request handling responsive.

### Pool Configuration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Piscina Pool Configuration                                    │
│                                                                                  │
│  File: src/config/workerPool.js                                                  │
│                                                                                  │
│  ┌──────────────────────┬──────────┬──────────────────────────┐                 │
│  │ Parameter             │ Value    │ Description              │                 │
│  ├──────────────────────┼──────────┼──────────────────────────┤                 │
│  │ minThreads           │ 2        │ Minimum active threads   │                 │
│  │ maxThreads           │ 4        │ Maximum active threads   │                 │
│  │ idleTimeout          │ 30000ms  │ Thread idle timeout      │                 │
│  │ maxTasksPerWorker    │ 1000     │ Tasks per worker lifetime│                 │
│  │ filename             │ worker.js│ Worker entry point       │                 │
│  └──────────────────────┴──────────┴──────────────────────────┘                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Task Types

| Task Type | Description | Handler File | Used By |
|-----------|-------------|--------------|---------|
| `hash-password` | Argon2id password hashing | argon2Worker.js | User registration, login |
| `verify-password` | Argon2 hash verification | argon2Worker.js | Login, profile update |
| `bash-exec` | Shell command execution | worker.js (child_process) | Tool execution, LLM tools |

### Worker Dispatch Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Worker Task Dispatch                                          │
│                                                                                  │
│  ┌──────────────┐                                                                │
│  │  Express     │  Main thread receives request                                  │
│  │  Controller  │                                                                  │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │  Service     │  Determines task needed (hash, verify, bash)                   │
│  │              │                                                                  │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                      │
│  │  piscina.run │───▶│  Thread 1    │───▶│  Execute     │                      │
│  │              │    │  (available) │    │  task        │                      │
│  │  Promise     │    └──────────────┘    └──────┬───────┘                      │
│  │              │    ┌──────────────┐           │                                │
│  │              │    │  Thread 2    │      Result returned                     │
│  │              │    │  (busy)      │◀──────────┘                                │
│  │              │    └──────────────┘                                            │
│  │              │    ┌──────────────┐                                            │
│  │              │    │  Thread 3    │  Task queued                               │
│  │              │    │  (idle)      │                                            │
│  │              │    └──────────────┘                                            │
│  └──────┬───────┘                                                                │
│         │ Promise resolves                                                       │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │  Controller  │  Continues with result                                         │
│  │              │                                                                  │
│  └──────┬───────┘                                                                │
│         │                                                                        │
│         ▼                                                                        │
│  ┌──────────────┐                                                                │
│  │  Response    │  { success: true, data: ... }                                 │
│  │              │                                                                  │
│  └──────────────┘                                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Bash Execution Details

Bash commands execute via `child_process.spawn` with a configurable timeout. Output is captured (stdout + stderr) and returned as a string. This is used for the built-in `bash` tool that LLMs can invoke during multi-turn conversations.

---

## Database Relationships

All data uses Mongoose models against MongoDB. Here are the key collections and their relationships:

### Collection Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MongoDB Collections & Relationships                           │
│                                                                                  │
│  ┌──────────────────┐                                                            │
│  │   User           │  roles: ['user'] (array, not single value)                │
│  │   (users)        │                                                            │
│  │                  │  _id (ObjectId)                                            │
│  │  ┌──────────────┐│  username, email                                           │
│  │  │ preferences  ││  hash (argon2id), is_active                               │
│  │  │              ││                                                            │
│  │  │ theme        ││  created_at, last_login                                   │
│  │  │ default_model││                                                            │
│  │  │ language     ││  ──── 1:N ──────────────────────────────────────►         │
│  │  └──────────────┘│  ┌──────────────────────────────────────────────────┐      │
│  └──────────────────┘  │  ChatSession                                    │      │
│                        │  (chats)                                         │      │
│                        │  user_id → User._id                              │      │
│                        │  session_name, subject                           │      │
│                        │  messages: [{role, content, timestamp, ...}]     │      │
│                        │  memory: {summary, keyPoints, entities, prefs}   │      │
│                        │  ──── 1:N ──────────────────────────────────────►    │      │
│                        │  ┌──────────────────────────────────────────┐       │      │
│                        │  │ ToolCall                                 │       │      │
│                        │  │ (tool_calls)                             │       │      │
│                        │  │ session_id → ChatSession._id             │       │      │
│                        │  │ tool_name, arguments, result, timestamp  │       │      │
│                        │  └──────────────────────────────────────────┘       │      │
│                        └──────────────────────────────────────────────────────┘      │
│                                                                                        │
│  ┌──────────────────┐                                                                  │
│  │   User           │  ──── 1:N ─────────────────────────────────────────►             │
│  │                  │  ┌──────────────────────────────────────────┐                    │
│  │                  │  │ Tool                                     │                    │
│  │                  │  │ (tools)                                  │                    │
│  │                  │  │ user_id → User._id                       │                    │
│  │                  │  │ name, description, code (JS)             │                    │
│  │                  │  │ parameters: [{name, type, required}]     │                    │
│  │                  │  │ is_active, return_type, usage_count      │                    │
│  │                  │  └──────────────────────────────────────────┘                    │
│  │                  │                                                                  │
│  │                  │  ──── 1:N ─────────────────────────────────────────►             │
│  │                  │  ┌──────────────────────────────────────────┐                    │
│  │                  │  │ RAGDocument                              │                    │
│  │                  │  │ (documents)                              │                    │
│  │                  │  │ user_id → User._id                       │                    │
│  │                  │  │ filename, file_type, status              │                    │
│  │                  │  │ chunks: [{text, embedding, tokens}]      │                    │
│  │                  └────────────────────────────────────────────┘                     │
│                                                                                        │
│  ┌──────────────────┐                                                                  │
│  │   User           │  ──── 1:N ─────────────────────────────────────────►             │
│  │                  │  ┌──────────────────────────────────────────┐                    │
│  │                  │  │ Prompt                                   │                    │
│  │                  │  │ (prompts)                                │                    │
│  │                  │  │ user_id → User._id                       │                    │
│  │                  │  │ name, description, content               │                    │
│  │                  │  │ type, tags, is_public, variables         │                    │
│  │                  └────────────────────────────────────────────┘                     │
│                                                                                        │
│  ┌──────────────────┐                                                                  │
│  │   User           │  ──── 1:N ─────────────────────────────────────────►             │
│  │                  │  ┌──────────────────────────────────────────┐                    │
│  │                  │  │ UserMemory                               │                    │
│  │                  │  │ (user_memories)                          │                    │
│  │                  │  │ user_id → User._id                       │                    │
│  │                  │  │ layer: episodic|semantic|procedural      │                    │
│  │                  │  │ content, embedding, tags                 │                    │
│  │                  │  │ metadata: {source_session_id, keywords,  │                    │
│  │                  │  │   confidence, expires_at, access_count}  │                    │
│  │                  └────────────────────────────────────────────┘                     │
│                                                                                        │
│  ┌──────────────────┐                                                                  │
│  │   User           │  ──── 1:N ─────────────────────────────────────────►             │
│  │   (owner_id)     │  ┌──────────────────────────────────────────┐                    │
│  │                  │  │ DocumentGroup                            │                    │
│  │                  │  │ (document_groups)                         │                    │
│  │                  │  │ owner_id → User._id                      │                    │
│  │                  │  │ name, description                        │                    │
│  │                  │  │ members: [{user_id, permission}]         │                    │
│  │                  │  └──────────────────────────────────────────┘                    │
│  │                  │                                                                  │
│  │                  │  members[].user_id ── 1:N ──► RAGDocument                        │
│  └──────────────────┘                                                                  │
│                                                                                        │
│  Other collections (no direct user FK):                                                │
│  ┌──────────────────────────────────────────┐                                         │
│  │  MatrixMessage (matrix_messages)          │                                         │
│  │  Log (logs)                               │                                         │
│  └──────────────────────────────────────────┘                                          │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Schema Notes

- **User `roles`** is an array of strings (`['user']`, `['admin']`), never a single value. The header displays `user?.roles?.[0]`.
- **Chat routes** in the database use `_id` (ObjectId). API routes accept both `/:id` and `/:sessionId` path params.
- **Documents** belong to users individually, but can also be shared via DocumentGroup members with permission levels.

---

## Security Architecture

The system implements defense-in-depth with multiple security layers.

### Password Hashing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Password Security                                             │
│                                                                                  │
│  Algorithm: Argon2id (NIST-recommended, memory-hard)                             │
│  Library: node-argon2 v1.0.0                                                    │
│  Execution: Piscina worker threads                                               │
│                                                                                  │
│  Registration:                                                                    │
│    Password ──▶ [argon2.hash(password)] ──▶ argon2id hash ──▶ MongoDB            │
│                                                                                  │
│  Login:                                                                         │
│    Password ──▶ [argon2.verify({ hash, password })] ──▶ boolean                 │
│                                                                                  │
│  Note: argon2 v1.0.0 uses OBJECT form for verify:                                │
│    argon2.verify({ hash: user.hash, password: inputPassword })                   │
│    NOT the two-argument form.                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Token Authentication

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JWT Token Flow                                                │
│                                                                                  │
│  Login Response:                                                                │
│    { success: true, data: { token: "eyJ...", user: {...} } }                   │
│                                                                                  │
│  Subsequent Requests:                                                           │
│    Authorization: Bearer <token>                                                 │
│                                                                                  │
│  authMiddleware:                                                                │
│    req.headers.authorization ──▶ extract "Bearer X" ──▶ jwt.verify(X, secret)   │
│    Sets: req.user = { user_id, username, email, roles }                        │
│    On failure: returns 401                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### RBAC Authorization

| Middleware | Roles Required | Used By |
|-----------|---------------|---------|
| `authMiddleware` | Any authenticated user | All protected routes |
| `authorize(roles)` | Specified roles in array | User management, tool creation |
| `requireAdmin` | Must include 'admin' | User CRUD, system health |
| `requireSystem` | Must include 'system' | Matrix bot endpoints |

### Rate Limiting

| Limiter | Window | Max Requests | Applies To |
|---------|--------|-------------|------------|
| API | 15 minutes | 100 | All authenticated API requests |
| Auth | 15 minutes | 5 | `/api/auth/login` |
| Registration | 24 hours | 3 | `/api/auth/register` |

### Input Validation

Login and registration endpoints use `express-validator` chains:
- Username: 3–50 chars, alphanumeric + underscore
- Email: valid email format, normalized
- Password: minimum 12 characters, uppercase, lowercase, number

---

## Streaming Architecture

The frontend receives real-time streaming responses via Server-Sent Events (SSE) from the chat endpoint.

### SSE Event Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SSE Streaming Flow                                            │
│                                                                                  │
│  Client: Vue 3 + Pinia store                                                    │
│    POST /api/chat/:id/llm/stream?stream=true                                    │
│    Headers: Authorization: Bearer <token>                                       │
│                                                                                  │
│  Server: chatController → llamaService → SSE stream                             │
│                                                                                  │
│  Event Types Received by Frontend:                                              │
│                                                                                  │
│  event: chunk                                                                   │
│  data: { type: "content", text: "Hello" }                                       │
│    ↳ Pinia appends text to response display                                     │
│                                                                                  │
│  event: chunk                                                                   │
│  data: { type: "tool_call_start", name: "bash", args: "{...}" }                 │
│    ↳ UI shows "Running tool: bash..."                                           │
│                                                                                  │
│  event: chunk                                                                   │
│  data: { type: "tool_call_arg", arg: "ls -la" }                                 │
│    ↳ UI fills in tool arguments                                                 │
│                                                                                  │
│  event: chunk                                                                   │
│  data: { type: "tool_result", result: "file1.txt file2.js" }                    │
│    ↳ UI shows tool output                                                       │
│                                                                                  │
│  event: done                                                                    │
│  data: { type: "done" }                                                         │
│    ↳ Pinia marks response complete, enables send button                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Frontend Streaming Implementation

The Vue 3 frontend uses `fetch` with `ReadableStream` to consume SSE events. The Pinia chat store maintains streaming state:

- `isStreaming`: boolean, prevents concurrent sends
- `currentResponse`: accumulated text buffer
- Message list updates incrementally as chunks arrive

### Context Window Management

During multi-turn tool call loops, the system manages context carefully:
1. System prompt (memory + RAG + skills) stays constant
2. User message added each turn
3. LLM response added (content or tool calls)
4. Tool result messages added for each tool execution
5. MAX_TOOL_TURNS prevents infinite loops

---

## Data Flow Diagrams

### User Registration

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Client   │────▶│ Express   │────▶│ Validate  │────▶│ Worker    │
│           │     │ Server    │     │ Input     │     │ (argon2)  │
│ POST      │     │           │     │           │     │           │
│ /register │     │ authMiddleware checks none  │     │ hash-password│
└───────────┘     └───────────┘     └───────────┘     └─────┬─────┘
                                                             │
                                                             ▼
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Client   │◀────│ Express   │◀────│ Service   │◀────│ Worker    │
│           │     │ Server    │     │           │     │           │
│ token +   │     │           │     │ Save to   │     │ hash result│
│ user data │     │ {success, │     │ MongoDB   │     │ returned   │
└───────────┘     │  data}    │     └───────────┘     └───────────┘
                  └───────────┘
```

### Chat Request

```
┌──────┐  POST /chat/stream    ┌──────────┐   ┌──────────┐   ┌──────────┐
│Client│──────────────────────▶│ Express  │──▶│ authMid. │──▶│ chatSvc │
│      │ Auth: Bearer token    │ Server   │   │ (JWT)    │   │ runLoop │
└──────┘                       └──────────┘   └──────────┘   └────┬─────┘
                                                                  │
                                              ┌───────────────────┼───────────────────┐
                                              ▼                   ▼                   ▼
                                       ┌──────────┐        ┌──────────┐        ┌──────────┐
                                       │ Memories │        │ RAG      │        │ Skills   │
                                       │ fetch    │        │ search   │        │ discover │
                                       └────┬─────┘        └────┬─────┘        └────┬─────┘
                                              │                   │                   │
                                              └───────────────────┼───────────────────┘
                                                                  ▼
                                                           ┌──────────┐
                                                           │ Build    │
                                                           │ system   │
                                                           │ prompt   │
                                                           └────┬─────┘
                                                                  ▼
                                                           ┌──────────┐
                                                           │ llamaSvc │
                                                           │ → Llama  │
                                                           │ .cpp     │
                                                           └────┬─────┘
                                                                  │
                                                     ┌────────────┼────────────┐
                                                     ▼            ▼            ▼
                                               ┌──────────┐ ┌──────────┐ ┌──────────┐
                                               │ Content  │ │ Tool Call│ │ Error    │
                                               │ only     │ │ loop     │ │          │
                                               └────┬─────┘ └────┬─────┘ └──────────┘
                                                    │            │
                                                    ▼            ▼
                                             ┌──────────┐ ┌──────────┐
                                             │ Save to  │ │ execute  │
                                             │ MongoDB  │ │ tools    │
                                             └──────────┘ └────┬─────┘
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                       ┌──────────┐ ┌──────────┐ ┌──────────┐
                                       │ bash     │ │ read     │ │ custom   │
                                       │ (worker) │ │ (eval)   │ │ tool     │
                                       └──────────┘ └──────────┘ └──────────┘

                                                  ▼
                                           ┌───────────────┐
                                           │ SSE events    │
                                           │ to client     │
                                           └───────────────┘
```

---

## Tags

- `architecture` - System architecture
- `deep-dive` - Detailed system overview
- `backend` - Node.js/Express backend
- `frontend` - Vue 3 frontend
- `security` - Security design
- `streaming` - SSE streaming
- `worker-threads` - Piscina worker pool

---

## Related Documentation

- [System Architecture](./system-architecture.md) - High-level architecture overview
- [Worker Threads](./worker-threads.md) - Piscina implementation details
- [Security Design](./security-design.md) - Security layers and middleware
- [Database Schema](./database-schema.md) - Collection field definitions
- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [LLM Integration](../features/llm-integration.md) - Llama.cpp integration details
- [Persistent Memory](../features/persistent-memory.md) - Memory system architecture
- [Tool Support](../features/tool-support.md) - Tool execution flow
