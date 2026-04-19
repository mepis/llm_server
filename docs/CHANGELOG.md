# Changelog

All notable changes to the LLM Server application.

---

## [Unreleased] - 2026-04-19

### Backend Fixes

#### Authentication & Password Hashing
- **Fixed**: `src/scripts/createAdmin.js` - Was using `bcrypt` with `password` field but model requires `argon2` with `password_hash` field. Changed to use `User.hashPassword()` and `password_hash` field.
- **Fixed**: `src/services/userService.js` - Was using `bcrypt.compare()` for password verification but all passwords are hashed with `argon2`. Changed to use `user.checkPassword()` method.
- **Fixed**: `src/models/User.js` - `node-argon2` v1.0.0 `verify()` API changed to accept `{hash, password}` object instead of two separate arguments. Updated `verifyPassword()` and `checkPassword()` methods.

#### Chat
- **Fixed**: `src/models/ChatSession.js` - Missing `chat_id` virtual property and JSON serialization. Added `chat_id` virtual and `toJSON` transform with `virtuals: true`.
- **Fixed**: `src/controllers/chatController.js` - Methods used `req.params.sessionId` but routes define `/:id/llm` which sets `req.params.id`. Changed all methods to use `req.params.sessionId || req.params.id`.

#### Database Models & Services
- **Fixed**: `src/services/promptService.js` - Was a class requiring db injection but imported as plain module. Created `src/models/Prompt.js` Mongoose model and rewrote service to use Mongoose.
- **Fixed**: `src/services/toolService.js` - Same issue as promptService. Created `src/models/Tool.js` Mongoose model and rewrote service to use Mongoose.
- **Fixed**: `src/services/logService.js` - Same issue as promptService. Created `src/models/Log.js` Mongoose model and rewrote service to use Mongoose.

### Skill System (OpenCode Integration)

- **Added**: `src/tool/skill.js` — Core skill definition API with Zod validation, JSON schema conversion, OpenAI function tool format
- **Added**: `src/services/skillService.js` — New service for retrieving accessible skills based on user roles via `skillModel.find({ roles: { $in: userRoles } })`
- **Added**: `src/controllers/skillController.js` — New controller with `getAccessibleSkills` endpoint
- **Added**: `src/routes/skill.js` — New `/skills` routes mounted in `api.js`
- **Added**: `frontend/src/stores/skill.js` — Pinia store with `getAccessibleSkills()` action using `response.data.data`
- **Added**: `frontend/src/views/skills/SkillsView.vue` — New skills view component
- **Modified**: `frontend/src/components/layout/Header.vue` — Added "Skills" link to desktop and mobile navs
- **Modified**: `frontend/src/components/layout/Sidebar.vue` — Added "Skills" link under Management section
- **Modified**: `frontend/src/router/index.js` — Added `/skills` route pointing to `SkillsView.vue`
- **Modified**: `src/controllers/chatController.js` — Passes `userRoles` to chat service for skill prompt building
- **Modified**: `src/services/chatService.js` — Added `buildSkillsPrompt()` and integrated skills into system message before RAG context
- **Modified**: `src/tool/index.js` — Registered `skillTool` with builtin tools

### Frontend Fixes

#### Pinia Stores (Response Data Extraction)
All stores were storing `response.data` (the full API response `{ success: true, data: ... }`) instead of `response.data.data` (the actual data). Fixed the following stores:

- **Fixed**: `frontend/src/stores/chat.js` - All actions now use `response.data.data`. Updated `createSession()`, `listSessions()`, `loadChat()`, and `deleteChat()`.
- **Fixed**: `frontend/src/stores/auth.js` - `fetchUser()` now uses `response.data.data`.
- **Fixed**: `frontend/src/stores/rag.js` - All actions now use `response.data.data`.
- **Fixed**: `frontend/src/stores/prompt.js` - Rewrote entire store to use `response.data.data`.
- **Fixed**: `frontend/src/stores/tool.js` - Rewrote entire store to use `response.data.data`. Added `response.data.data` to `executeTool()`.
- **Fixed**: `frontend/src/stores/log.js` - Rewrote to use `response.data.data`. Added pagination state (`pagination` object with `total`, `page`, `limit`, `totalPages`).
- **Fixed**: `frontend/src/stores/llama.js` - Rewrote to use `response.data.data`.
- **Fixed**: `frontend/src/stores/user.js` - Rewrote to use `response.data.data`.
- **Fixed**: `frontend/src/stores/matrix.js` - Rewrote to use `response.data.data`.

#### UI Components
- **Fixed**: `frontend/src/components/layout/Header.vue` - Used `user?.role` but user object has `roles` (array). Changed to `user?.roles?.[0]` in both desktop and mobile views.

#### Views
- **Fixed**: `frontend/src/views/logs/LogsView.vue` - Accessed `logStore.logs.pagination` but pagination was on a separate `logStore.pagination` object. Changed to `logStore.pagination.totalPages`.

### Tool Calling (OpenCode Pattern)

- **Added**: `src/tool/tool.js` — Core tool definition API with Zod validation, JSON schema conversion, OpenAI function tool format, output truncation (2000 lines / 50KB)
- **Added**: `src/tool/truncate.js` — Output truncation service with temp file saving
- **Added**: `src/tool/registry.js` — Tool registry loading builtins + custom tools, converting to OpenAI format
- **Added**: `src/tool/index.js` — Registers all 7 builtin tools on import
- **Added**: `src/tool/bash.js` — Bash tool: executes commands via Piscina worker with timeout and abort support
- **Added**: `src/tool/read.js` — Read tool: reads files with line/byte limits, binary detection, directory listing
- **Added**: `src/tool/write.js` — Write tool: writes files, supports search-and-replace editing with uniqueness checks
- **Added**: `src/tool/glob.js` — Glob tool: file pattern matching with `**` recursive support
- **Added**: `src/tool/grep.js` — Grep tool: regex search across files with context lines and include filtering
- **Added**: `src/tool/question.js` — Question tool: prompts user for input via `ctx.ask()`
- **Added**: `src/tool/todo.js` — Todo tool: task list management (add/complete/remove/list) persisted in session metadata
- **Added**: `src/models/ToolCall.js` — New model tracking tool calls with state machine (pending → running → completed/error)
- **Added**: `src/services/llamaService.js` — New `chatWithTools()` method passing `tools` array to Llama.cpp `/v1/chat/completions`
- **Added**: `src/services/chatService.js` — New `runLoop()` function implementing the tool-calling loop (up to 10 turns), `resolveTools()` for tool resolution, `getToolCalls()` endpoint
- **Added**: `src/controllers/chatController.js` — New `getToolCalls` and `getToolCall` endpoints
- **Modified**: `src/models/ChatSession.js` — Added `tool` role to message enum, `tool_calls` and `tool_call_id` fields, updated `addMessage()` to handle tool calls
- **Added**: `src/routes/chat.js` — New `GET /:id/tool-calls` and `GET /:id/tool-calls/:toolCallId` routes
- **Modified**: `src/routes/tool.js` — Reordered routes so `POST /call/:toolId` matches before `GET /:toolId`
- **Modified**: `src/controllers/toolController.js` — Rewired to use `toolService` for real execution
- **Modified**: `src/services/toolService.js` — Added real `callTool()` with Zod validation and `AsyncFunction` execution
- **Modified**: `src/workers/worker.js` — Added `bash` command execution via `child_process.spawn`
- **Modified**: `frontend/src/stores/chat.js` — New `sendMessage()` handling tool calls, `loadToolCalls()`, `loadToolCall()`
- **Modified**: `frontend/src/stores/tool.js` — Fixed execute endpoint to `/tools/call/${toolId}`
- **Modified**: `frontend/src/views/chat/ChatView.vue` — Added tool call display with collapsible tool results section
- **Added**: `package.json` — Dependencies: `zod`, `glob`

### Tool RBAC Access Control

- **Added**: `src/models/Tool.js` - New `roles` field (array, enum: `user`, `admin`, `system`, default `['user']`). Made `user_id` optional. Added `roles` index.
- **Added**: `src/services/toolService.js` - Replaced all ownership-based (`user_id`) queries with role-based queries using `{ roles: { $in: userRoles } }`. Renamed `getUserTools` to `getAccessibleTools`. Admin-only operations (update/delete) query by `_id` without role filtering.
- **Added**: `src/controllers/toolController.js` - Pass `req.user.roles` to service for read/call operations. Accept `roles` from request body in `createTool`. Return 403 for access-denied errors.
- **Added**: `src/routes/tool.js` - `POST /`, `PUT /:id`, `DELETE /:id` now use `rbac.requireAdmin`. `GET /`, `GET /:id`, `POST /call/:id` use `authMiddleware` with role-based service filtering.
- **Added**: `frontend/src/stores/tool.js` - Added `hasAdminRole` and `canExecuteTool` getters. All actions handle role-based access.
- **Added**: `frontend/src/views/tools/ToolsView.vue` - Role-gated buttons (New Tool/Edit/Delete for admin only, Execute gated by tool roles). Shows role badges on tool cards. Shows "Access denied" when user lacks role.
- **Fixed**: `frontend/src/components/layout/Sidebar.vue` - Changed `user?.role` to `user?.roles?.[0]` (was always undefined, breaking admin section visibility).
- **Added**: `frontend/src/axios.js` - Added 403 interceptor to handle access denied responses.
- **Fixed**: `src/services/toolService.js` - Tool code execution was failing for full function declarations. Added normalization to strip function wrapper before `AsyncFunction` evaluation.

---

### Summary

| Category | Bugs Fixed |
|----------|-----------|
| Authentication | 3 |
| Chat | 2 |
| Database Models | 6 |
| Pinia Stores | 10 |
| UI Components | 1 |
| Views | 2 |
| Tool RBAC | 6 |
| Tool Calling | 24 |
| **Total** | **50** |

### Agent Instructions

- **Modified**: `AGENTS.md` - Added "Commit & Push" section requiring changelog update before every commit and push operation.

## [Documentation Update] - 2026-04-19

### Documentation Improvements

- **Added**: Comprehensive diagrams to all documentation pages including architecture, features, components, API, technical, and QA pages
- **Added**: Wiki-style cross-references between all documentation pages
- **Added**: Tag system with 40+ tags organized by categories (authentication, security, features, integration, infrastructure, technical, error handling, QA, workflow)
- **Added**: `docs/tags-index.md` - Comprehensive tag-based navigation index organized by categories
- **Added**: Feature-based and role-based tag cross-reference diagrams
- **Added**: Quick navigation guides for different developer roles (auth, chat, RAG, frontend, DevOps, QA, debugging)
- **Added**: Diagrams to `docs/qa/api-testing-examples.md` - API testing architecture and test flow diagrams
- **Added**: Diagrams to `docs/qa/practical-examples.md` - Complete RAG workflow diagram
- **Enhanced**: `docs/features/user-management.md` - Simplified role hierarchy diagram
- **Enhanced**: `docs/features/matrix-integration.md` - Enhanced webhook configuration flow
- **Enhanced**: `docs/components/pinia-stores.md` - Added component lifecycle diagram
- **Enhanced**: `docs/technical/configuration-guide.md` - Enhanced DB connection pool lifecycle diagram
- **Enhanced**: `docs/api/api-endpoints.md` - Added response streaming flow diagram
- **Updated**: `AGENTS.md` - Added comprehensive documentation reference section linking to all docs
- **Fixed**: `docs/tags-index.md` - Fixed path mismatch (`./api-endpoints.md` → `./api/api-endpoints.md`)
- **Added**: `docs/index.md` - Documentation improvement checklist for future enhancements

### Documentation Structure

```
docs/
├── index.md                    # Main entry point with quick links and architecture overview
├── tags-index.md               # Tag-based navigation organized by categories
├── architecture/               # Architecture docs (4 files with diagrams)
│   ├── system-architecture.md  # Overall system design
│   ├── database-schema.md      # MongoDB collections and indexes
│   ├── security-design.md      # Auth, JWT, RBAC
│   └── worker-threads.md       # Piscina pool configuration
├── features/                   # Feature docs (9 files with diagrams)
│   ├── authentication.md       # User registration, login, JWT
│   ├── user-management.md      # User CRUD operations
│   ├── chat-sessions.md        # Conversations, streaming, memory
│   ├── llm-integration.md      # Llama.cpp inference, embeddings
│   ├── rag-system.md           # Document processing, semantic search
│   ├── prompt-management.md    # Prompt templates, variables
│   ├── tool-support.md         # Custom tools, execution
│   ├── system-monitoring.md    # Logs, health checks
│   └── matrix-integration.md   # Matrix bot, webhooks
├── components/                 # Component docs (3 files with diagrams)
│   ├── frontend-components.md  # Vue 3 components
│   ├── pinia-stores.md         # Pinia state management
│   └── middleware.md           # Security middleware
├── api/                        # API docs (3 files with diagrams)
│   ├── api-endpoints.md        # Complete endpoint reference
│   ├── request-response-formats.md # Standard patterns
│   └── error-handling.md       # Error codes and handling
├── technical/                  # Technical docs (4 files with diagrams)
│   ├── configuration-guide.md  # Environment variables
│   ├── deployment-guide.md     # Docker, production
│   ├── performance-guide.md    # Optimization strategies
│   └── troubleshooting.md      # Common issues
├── qa/                         # QA docs (2 files with diagrams)
│   ├── api-testing-examples.md # Test cases
│   └── practical-examples.md   # Usage patterns
└── llama.cpp_docs/             # Llama.cpp reference docs (15 files)
```
