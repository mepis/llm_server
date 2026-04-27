# Changelog

All notable changes to the LLM Server application.

---

## [Unreleased] - 2026-04-27

### Router & Admin Views
- **Added**: Llama, Matrix, Config, and Debug routes under admin namespace in `frontend/src/router/index.js`
- **Added**: Redirects for `/users` → `/admin/users` and `/roles` → `/admin/roles`
- **Added**: New frontend view folders: `config/`, `debug/`, `llama/`, `matrix/`

### Auth Store Improvements
- **Fixed**: `frontend/src/stores/auth.js` — `fetchUser()` now validates user data shape (`user_id` or `id`) before storing; calls `logout()` and throws on invalid response to prevent stale auth state

### Bug Fixes
- **Fixed**: `src/db/schema.js` — Escaped reserved word `key` as `` `key` `` in configs table creation
- **Fixed**: `src/services/userService.js` — Replaced broken `JSON_CONTACT` raw queries with Knex `.where()` / `.orWhere()` for username/email checks in `registerUser` and `createUser`
- **Fixed**: `src/services/userService.js` — `loginUser` now properly parses `roles` (string → array) before passing to `generateToken`; handles serialized `preferences` JSON
- **Fixed**: `src/services/userService.js` — `getUserById` now deserializes `roles` and `preferences` JSON columns before returning

### Documentation & Testing
- **Added**: `docs/security-audit.md` — Security audit documentation
- **Added**: `frontend_test.py` — Frontend test script

---

## [Unreleased] - 2026-04-26

### Qdrant gRPC Migration
- **Migrated**: Qdrant client from HTTP (`@qdrant/js-client-rest`) to gRPC (`@qdrant/js-client-grpc`) for lower latency and better performance
- **Updated**: `src/db/qdrant.js` — Full rewrite with protobuf types, oneof patterns, BigInt conversions, and `getChunksScroll()` helper for paginated retrieval
- **Fixed**: `initQdrant()` now called at server startup (previously never invoked — collection was never auto-created)
- **Fixed**: Duplicate `QdrantClient` instantiation in `ragService.getChunks()` replaced with shared `qdrant` module singleton
- **Updated**: Environment variables `QDRANT_URL` replaced with `QDRANT_GRPC_HOST` and `QDRANT_GRPC_PORT`
- **Updated**: `src/server.js` — Added `initQdrant()` call with graceful fallback warning
- **Updated**: `package.json` — Replaced `@qdrant/js-client-rest` with `@qdrant/js-client-grpc@^1.17.0`
- **Updated**: `AGENTS.md` — Qdrant startup note now mentions gRPC port 6334
- **Updated**: `docs/technical/configuration-guide.md` — Added Qdrant gRPC configuration section

---

## [Unreleased] - 2026-04-25

### chat_messages Table Migration
- **Added**: `chat_messages` table schema in `src/db/schema.js` — Normalized storage for chat messages with role, content, metadata, tool_calls, citations columns
- **Added**: `migrateChatMessages` function — Migrates existing messages from `chat_sessions.messages` JSON column to new `chat_messages` table
- **Modified**: `src/services/chatService.js` — Messages now written to both `chat_messages` table and session JSON for backward compatibility; `getMessages` reads from `chat_messages` first with JSON fallback; `clearSessionMessages` and `deleteSession` clean up both locations

### Security Improvements
- **Fixed**: `GET /api/users/` now strips `password_hash` from user list responses (`src/controllers/userController.js`)
- **Fixed**: `GET /` user route explicitly requires `rbac.requireAdmin` middleware (`src/routes/user.js`)
- **Added**: Bash tool input validation — Blocks command chaining (`;`, `&&`, `||`) and command substitution (backticks, `$()`) to prevent injection attacks (`src/tool/bash.js`)
- **Added**: Worker bash environment sanitization — Spawns processes with minimal environment variables (only HOME, PATH, SHELL, USER, LANG, LC_ALL, TERM, PWD, NODE_*); enforces 120s hard timeout with SIGKILL (`src/workers/worker.js`)
- **Added**: RAG error message sanitization — Strips file paths and stack traces from parse errors to prevent information leakage (`src/services/ragService.js`)

### User Service Bug Fixes
- **Fixed**: Incorrect `knex().('users')` syntax across all userService functions → corrected to `knex()('users')`
- **Added**: Zod validation schema for user update operations with proper 400 error responses (`src/services/userService.js`)

### Integration Updates
- **Moved**: Model scripts from `integrations/llama/models/` to `integrations/llama/archived/` — Deprecated model configs archived
- **Added**: `integrations/llama/router.sh` — Top-level router script for llama server
- **Modified**: `integrations/llama/install.sh` — CUDA env vars moved to top; run.sh generation commented out; hardcoded `ExecStart` to `router.sh`
- **Modified**: `integrations/opencode/opencode.json` — Replaced hardcoded IPs with environment variables (`OPENCODE_HOST`, `MERLIN_API_URL`, `BETTY_API_URL`, `LOCAL_API_URL`)

### MariaDB and phpMyAdmin Integration

- **Added**: `integrations/mariadb/` — New integration scripts for MariaDB and phpMyAdmin
- **Added**: `integrations/mariadb/install.sh` — Interactive installation script
- **Added**: `integrations/mariadb/install_mariadb.sh` — MariaDB standalone installation script
- **Added**: `integrations/mariadb/install_phpmyadmin.sh` — phpMyAdmin standalone installation script
- **Added**: `integrations/mariadb/README.md` — Documentation for MariaDB integration scripts

### Database Migration (MongoDB → MariaDB)
- **Replaced**: MongoDB/Mongoose with MariaDB/Knex as the primary database layer
- **Added**: `src/config/mariadb.js` — MariaDB connection configuration with connection pooling
- **Added**: `src/config/db.js` — Knex instance management (`connectDB`, `disconnectDB`, `getDB`)
- **Added**: `src/db/schema.js` — Table creation/dropping functions for all collections
- **Added**: `src/db/qdrant.js` — Qdrant vector store client configuration
- **Removed**: All Mongoose models (`src/models/ChatSession.js`, `Config.js`, `DocumentGroup.js`, `Log.js`, `MatrixMessage.js`, `Prompt.js`, `RAGChunk.js`, `RAGDocument.js`, `Role.js`, `Tool.js`, `ToolCall.js`, `User.js`, `UserMemory.js`)
- **Modified**: All controllers — Rewritten to use Knex queries instead of Mongoose model methods
- **Modified**: All services — Rewritten to use Knex queries instead of Mongoose model methods
- **Modified**: `src/tool/registry.js` — Tool loading uses Knex queries
- **Modified**: `src/tool/todo.js` — Session metadata updates use Knex queries
- **Modified**: `src/utils/database.js` — Database setup/clear uses Knex table functions
- **Modified**: `src/utils/environment.js` — Required env vars changed from `MONGODB_URI` to `MARIADB_HOST`, `MARIADB_PORT`, `MARIADB_USER`, `MARIADB_PASSWORD`, `MARIADB_DATABASE`; added `QDRANT_URL`
- **Modified**: `.env.example` — Updated environment variable documentation for MariaDB
- **Modified**: `package.json` — Dependency updates for database migration

### CORS Configuration
- **Added**: `CORS_ALLOWED_ORIGINS` env var — comma-separated list of allowed origins, separate from `FRONTEND_URL`
- **Modified**: `src/server.js` — CORS now reads from `CORS_ALLOWED_ORIGINS` instead of `FRONTEND_URL`

### Account Management
- **Added**: `display_name` and `matrix_username` fields to User model and API responses
- **Added**: `PATCH /api/users/me/change-password` endpoint for self-service password changes
- **Added**: Account settings view (`/account`) for managing display name, email, password, and Matrix username
- **Modified**: Header, Sidebar — display user `display_name` when available

### RAG System Refactor
- **Added**: `RAGChunk` model — chunks stored in separate collection with embeddings
- **Modified**: `ragService.js` — chunking creates `RAGChunk` documents; search queries chunks directly; delete cascades to chunks
- **Removed**: `embeddings` and `chunked_content` fields from `RAGDocument` schema
- **Modified**: `RAGDocumentsView`, `RAGQueriesView` — search endpoint updated to `/rag/search`

### Admin & Settings
- **Modified**: `AdminUsersView` — edit dialog includes display name and Matrix username fields
- **Modified**: `AdminSettingsView` — simplified User Preferences tab, links to Account page instead

### Frontend UI Improvements
- **Added**: Mobile-responsive styles for login/register pages (`100dvh`, breakpoints)
- **Added**: `VITE_APP_TITLE` env var support for customizable login title

---

## [Unreleased] - 2026-04-24

### Document Groups Button Fixes
- **Fixed**: `frontend/src/views/document-groups/DocumentGroupsView.vue` — Edit button now populates edit form via `openEditDialog`; Select visibility fields have `optionLabel`/`optionValue`; accessibleDocs uses computed store ref; isOwner/isEditor handle both `user_id` and `_id`; createGroup passes visibility
- **Fixed**: `frontend/src/stores/documentGroups.js` — `createGroup` accepts and sends `visibility` parameter
- **Fixed**: `src/controllers/documentGroupController.js` — extracts and validates `visibility` from request body
- **Fixed**: `src/services/documentGroupService.js` — `createGroup` uses passed visibility instead of hardcoding `'private'`

### RAG & UI Improvements
- **Modified**: `frontend/src/views/rag/RAGDocumentsView.vue` — Added toast notifications, file type filtering, replaced alerts with PrimeVue toasts
- **Modified**: `frontend/src/views/rag/RAGQueriesView.vue` — Fixed search result field mapping (`similarity`/`text`)
- **Fixed**: `frontend/src/stores/rag.js` — Search results correctly unwrap `response.data.data.results`
- **Added**: `src/server.js` — Global error handler for multer file upload errors (size limits, invalid types)

### RAG & Llama Integration Improvements

#### RAG System Refactor
- **Modified**: `src/controllers/ragController.js` — Switched to `memoryStorage` for uploads; removed manual directory management
- **Modified**: `src/models/RAGDocument.js` — Refactored chunking and status updates
- **Modified**: `src/routes/rag.js` — Added `multer` middleware to the document upload route
- **Modified**: `src/services/ragService.js` — Implemented background document processing; updated to use `fileBuffer` for uploads
- **Modified**: `frontend/src/views/rag/RAGDocumentsView.vue` — Simplified file upload logic in `handleFileUpload`

#### Llama & Embeddings Support
- **Added**: `src/config/database.js` — Added `embeddingsUrl` and `embeddingsModel` to `llama` configuration
- **Modified**: `src/controllers/llamaController.js` — Updated `createEmbedding` to pass model directly to service
- **Modified**: `src/services/llamaService.js` — Updated `getEmbeddings` to use configuration-driven URL and model defaults
- **Modified**: `integrations/llama/run.sh` — Changed default execution to use an embedding model script

#### Infrastructure & Integrations
- **Modified**: `integrations/init_ubuntu.sh` — Updated to install Intel OneAPI and CUDA 13.2
- **Added**: `integrations/llama/install_embedding_server.sh` — New script for embedding server setup
- **Added**: `integrations/llama/models/Qwen3-Embedding-4B-Q8_0.sh` — New embedding model installation script

## [Unreleased] - 2026-04-23

### RAG Operations & Per-User Persistent Memory (New Features)

#### Document Parsing Infrastructure
- **Added**: `src/services/documentParser.js` — File type parsers for PDF, DOCX, XLSX, CSV, TXT, MD, JSON with proper text extraction
- **Added**: `pdf-parse@^1.1.0`, `mammoth@^1.8.0`, `xlsx@^0.18.5` to package.json dependencies
- **Modified**: `src/services/ragService.js` — Replaced `fileBuffer.toString('utf8')` with DocumentParser; on parse error sets status='failed' with error_message
- **Modified**: `src/controllers/ragController.js` — Added DOCX and XLSX MIME types to fileFilter + extension-based fallback acceptance
- **Modified**: `src/models/RAGDocument.js` — Added 'xlsx' to file_type enum; added `sheets: [String]` and `parse_error: String` to metadata

#### Document Groups + RBAC (Custom Permission Model)
- **Added**: `src/models/DocumentGroup.js` — Document group model with owner/editor/viewer roles, visibility (private/team/public), compound unique index on name+owner_id
- **Added**: `src/services/documentGroupService.js` — CRUD operations for groups with Mongoose session atomicity for transferOwnership
- **Added**: `src/controllers/documentGroupController.js` — 10 REST endpoints for group management
- **Added**: `src/routes/documentGroups.js` — Document groups routes mounted at `/api/document-groups/*`
- **Modified**: `src/models/RAGDocument.js` — Added `group_ids: [ObjectId]` field and compound index `{ group_ids: 1, status: 1 }`
- **Modified**: `src/services/ragService.js` — `searchDocuments()` now searches personal docs AND group-accessible documents when documentIds not provided

#### Citation System
- **Added**: `src/utils/citationBuilder.js` — Citation ID assignment, source list formatting, deterministic fallback injection
- **Modified**: `src/services/ragService.js` — `searchDocuments()` returns structured results with per-chunk citation data and deduplicated sources array
- **Modified**: `src/services/chatService.js` — All three chat functions (chatWithLLM, runLoop, streamRunLoop) now extract and store citation metadata in assistant message `metadata.citations`
- **Added**: Citation instruction to system message prompting LLM to include `[1]`, `[2]` markers

#### Multi-Layer Persistent Memory System
- **Added**: `src/models/UserMemory.js` — Three-layer memory model (episodic/semantic/procedural) with TTL index for episodic, text search on keywords/tags, recency-based TTL extension
- **Added**: `src/services/memoryManager.js` — CRUD operations for all three layers with context budget enforcement (300 tokens total), keyword extraction
- **Added**: `src/utils/memoryExtractor.js` — Automatic memory extraction from conversations with PII redaction and keyword-based fallback extractor when llama.cpp unavailable
- **Added**: `src/controllers/memoryController.js` — 6 REST endpoints for memory management
- **Added**: `src/routes/memory.js` — Memory routes mounted at `/api/memory/*`
- **Modified**: `src/services/chatService.js` — Added `buildUserMemoryContext()` and `triggerAutomaticMemoryExtraction()` integrated into runLoop and streamRunLoop
- **Modified**: `src/routes/api.js` — Registered documentGroups and memory route modules

#### Frontend Updates
- **Added**: `frontend/src/stores/documentGroups.js` — Pinia store for document groups with all CRUD actions
- **Added**: `frontend/src/stores/memory.js` — Pinia store for memories with layer filtering and extraction
- **Added**: `frontend/src/views/document-groups/DocumentGroupsView.vue` — Group management UI with tabs for members and documents
- **Added**: `frontend/src/views/memory/MemoriesView.vue` — Three-layer memory browsing UI with search and manual extraction
- **Modified**: `frontend/src/router/index.js` — Added `/document-groups` and `/memory` routes; added `:docId` param to RAGDocumentsView route
- **Modified**: `frontend/src/components/layout/Sidebar.vue` — Added Document Groups and Memory menu items under Knowledge section
- **Modified**: `frontend/src/stores/chat.js` — Updated streaming done handler to extract citation metadata from SSE responses

#### Bug Fix (Phase 1.0)
- **Fixed**: `src/services/ragService.js` — `searchDocuments()` signature changed from `(userId, query)` to `(userId, query, limit = 10, documentIds = [])`
- **Fixed**: `src/services/chatService.js` — Fixed three call sites where `session.rag_document_ids` (array of ObjectIds) was passed as first argument instead of `session.user_id.toString()`
- **Fixed**: `src/controllers/ragController.js` — Now passes `filter_document_ids` from request body to search function

#### Documentation Updates
- **Added**: `docs/features/document-groups.md` — Document groups feature docs with schema diagram, RBAC matrix, workflow diagrams, API endpoints
- **Added**: `docs/features/persistent-memory.md` — Persistent memory docs with three-layer explanation, UserMemory schema, extraction workflow, context budget management
- **Added**: `docs/features/citation-system.md` — Citation system docs with format specification, system message template, integration points
- **Modified**: `docs/features/rag-system.md` — Added xlsx support, sheets tracking, parse_error handling to supported file types and schema
- **Modified**: `docs/architecture/database-schema.md` — Added DocumentGroups and UserMemories collections with field tables
- **Modified**: `docs/tags-index.md` — Added document-groups, persistent-memory, citations tags

---

## [Unreleased] - 2026-04-21

### Streaming Chat Improvements

#### Session Subject Auto-Generation
- **Added**: `generateSessionSubject` in `chatService` — auto-generates session names from the first user message for "New Chat" sessions
- **Added**: Subject generation runs after both `runLoop` and `streamRunLoop` complete; updated session name is yielded back to the frontend via the SSE 'done' event
- **Modified**: Frontend chat store merges the new subject into the session list and `currentChat` on stream completion

#### Tool Result Merging
- **Added**: Tool messages collapsed into assistant message `tool_results` arrays during session load (`listSessions`, `loadChat`) and streaming (`sendStreamingMessage`)
- **Removed**: Standalone `ToolResultCard` component — tool results now display inline within `AssistantMessage.vue` as collapsible details

#### Streaming Refinements
- **Added**: `rawOutput` tracking on assistant messages during streaming; displayed via "Raw LLM Output" collapsible in debug mode
- **Added**: Intermediate assistant messages from multi-turn streaming are unified into a single message with combined tool calls and results
- **Modified**: Error recovery in `sendStreamingMessage` uses index-based splice instead of pop for cleaner cleanup

### Chat History Pagination

#### Session Subject Auto-Generation
- **Added**: Server-side pagination to `GET /chats` via `getSessionsByUser(page, limit)` returning `{ sessions, total, page, limit, totalPages }`
- **Added**: `page` and `limit` query params to `GET /chats` controller endpoint
- **Added**: ChatHistoryView now shows configurable page size (10/20/50) with PrimeVue Paginator component
- **Added**: Session list items display message count and truncated last assistant message preview

### User Preferences
- **Added**: `chat_page_size` field in User model settings (enum: 10, 20, 50)
- **Added**: `PATCH /api/users/me` route for partial profile updates
- **Added**: ChatHistoryView loads and persists preferred page size via `settingsStore.updateUserPreferences()`
- **Added**: Debug mode toggle in ChatView (`settingsStore.debugMode`) — controls raw output visibility

### UI Enhancements
- **Added**: Error banner with dismiss button in ChatView for streaming errors
- **Added**: Inline scroll-to-bottom button in ChatView when scrolled up
- **Added**: `username` prop passed through to MessageBubble from auth store
- **Removed**: `ToolResultCard.vue` component (replaced by inline tool results in AssistantMessage)

### Features

#### User Management (Admin)
- **Added**: Full CRUD user management UI in `frontend/src/views/admin/AdminUsersView.vue` with DataTable, search, pagination, and role management
- **Added**: `POST /api/users/` endpoint to create users via `userController.createUser` and `userService.createUser`
- **Added**: `removeRole` support in `PATCH /api/users/:userId/role` — can now remove roles via `userService.removeUserRole`
- **Added**: `is_active` as an allowed update field in `userService.updateUser`

#### Admin Route Guards
- **Added**: `requiresAdmin: true` meta to Tools, Logs, and Monitor routes; non-admin users are redirected to `/chat`
- **Added**: Auto-fetch user profile on navigation when auth token exists but user object is missing (`authStore.fetchUser()`)

#### Frontend Cleanup
- **Removed**: `frontend/src/views/debug/DebugView.vue` and `frontend/src/stores/debug.js` — debug console interceptor removed
- **Removed**: Console interceptor utility (`frontend/src/utils/consoleInterceptor.js`) and its import in `main.js`
- **Added**: `frontend/src/utils/markdown.js` (new utility)
- **Added**: PrimeIcons CSS and PrimeVue `IconField`/`InputIcon` components registered globally

### Skills
- **Added**: `EditSkillView.vue` — dedicated create/edit page for skills with validation, tool picker (Chips + Dropdown), and two-column layout
- **Added**: Router routes `/skills/new` and `/skills/:name/edit` with admin guard (`requiresAdmin: true`)
- **Modified**: `SkillsView.vue` — removed inline dialog form; replaced with `RouterLink` navigation to edit page for New/Edit actions
- **Modified**: `src/services/skillService.js` — sanitizes skill names consistently via `sanitizedName` variable before filesystem operations; `getSkillByName` now matches both original and sanitized names

### Tool Builder (Dedicated Create/Edit Page)
- **Added**: `frontend/src/views/tools/EditToolView.vue` — dedicated create/edit page for tools with form validation, code editor, and parameter configuration
- **Added**: Router routes `/tools/new` and `/tools/:id/edit` with admin guard (`requiresAdmin: true`)
- **Modified**: `ToolsView.vue` — removed inline dialog form; replaced with `RouterLink` navigation to edit page for New/Edit actions

### Skill Service (Name Matching)
- **Modified**: `src/services/skillService.js` — `getSkillByName`, `updateSkill`, and `deleteSkill` now try multiple name sanitization strategies (removing hyphens, removing underscores) to find skill files with various naming conventions

### Other Improvements
- **Modified**: `EditSkillView.vue` — toast messages improved ("created/updated successfully"), toast duration set to 4s, better error detail extraction from API responses, navigation delayed 1.5s after save
- **Modified**: `integrations/opencode/skills/api_designer/SKILL.md` — fixed YAML frontmatter formatting (tools and model fields reordered)

### Streaming Chat
- **Added**: `sendStreamingMessage` in `chatStore` — SSE-based streaming with client-side parsing of `data:` lines
- **Added**: `POST /api/chats/:id/llm/stream` endpoint via `chatController.sendToLLMStream` and `chatService.streamRunLoop`
- **Modified**: `ChatView.vue` — updated to use streaming endpoint for LLM responses

### Health Checks & Config Management
- **Added**: `GET /api/system/health` endpoint checking health of Llama, TTS, and Matrix integrations with latency and status
- **Added**: `Config` model (`src/models/Config.js`) for persistent key-value settings
- **Added**: `configController` with CRUD endpoints for system config
- **Added**: `seedConfig` script to initialize default config values on startup
- **Modified**: `database.js` — added `session.maxToolTurns` config (from `MAX_TOOL_TURNS` env, default 10)

### Cleanup
- **Removed**: `docs/design/tts-migration-qwen3.md` — migrated plan no longer needed
- **Removed**: `integrations/opencode/skills/documentation-writer/SKILL.md` — using built-in skill instead

### Other Changes
- **Modified**: `frontend/src/axios.js` / `auth.js` — minor fixes to auth token handling
- **Modified**: `src/services/llamaService.js` — updates to Llama integration
- **Modified**: `package.json` — dependency update

---

## [Unreleased] - 2026-04-20

### Major Changes

#### Qwen3-TTS Migration (Replaces Chatterbox TTS)
- **Replaced**: Chatterbox gRPC TTS service with Qwen3-TTS as an external HTTP service
- **Added**: `integrations/qwen3-tts/` — Standalone Qwen3-TTS FastAPI service (`tts_service.py`, `requirements.txt`, `start.sh`, `README.md`) using `Qwen/Qwen3-TTS-12Hz-1.7B-Base` model
- **Removed**: Entire `src/services/chatterbox/` directory (gRPC server, protobuf definitions, TypeScript stubs, Python venv)
- **Removed**: `@grpc/grpc-js` and `@grpc/proto-loader` npm dependencies from `package.json`
- **Removed**: `start:chatter` script from `package.json`
- **Modified**: `src/services/llamaService.js` — Replaced gRPC client with axios HTTP calls to external TTS server; added `getSpeakers()` function
- **Modified**: `src/server.js` — Removed Chatterbox subprocess spawning and health checking; simplified startup/shutdown
- **Modified**: `src/config/database.js` — Replaced `chatterbox` config block with `tts` block (`serverUrl`, `timeout`, `speaker`, `language`); removed `llama.ttsSpeakerFile`
- **Modified**: `src/controllers/llamaController.js` — Updated TTS request handling to accept `speaker` and `language` parameters (removed `speakerFile`)
- **Modified**: `src/routes/llama.js` — Added `GET /tts/speakers` endpoint for listing available preset speakers
- **Modified**: `.env.example` and `.env` — Replaced `CHATTERBOX_*` environment variables with `TTS_*` (`TTS_SERVER_URL`, `TTS_TIMEOUT`, `TTS_DEFAULT_SPEAKER`)
- **Modified**: `AGENTS.md` — Updated TTS gotcha to reflect Qwen3-TTS external service architecture
- **Added**: `integrations/llama/models/` — TTS model scripts (`download-tts.sh`, `run-tts.sh`) and speaker reference (`en_male_1.json`)

#### Voice Modes
- CustomVoice (preset speakers: Ryan, Aiden, Vivian, Serena, etc.)
- VoiceDesign (text prompt-based voice)
- Base (voice cloning from reference audio via `speakerAudio` parameter)

#### API Changes
- **New endpoint**: `GET /api/llama/tts/speakers` — Returns available speaker presets with their languages and descriptions
- **Existing endpoint**: `POST /api/llama/tts` — Now accepts optional `speaker` and `language` body fields in addition to `text` and `speakerAudio`

#### Testing
- **Verified**: All 8 backend model tests pass
- **Verified**: All 30 RBAC integration tests pass
- **Verified**: All 10 E2E Playwright tests pass (home, login, register, health, auth flows, route access)
- **Verified**: TTS endpoints return expected error when `TTS_SERVER_URL` is not configured
- **Verified**: Speakers endpoint returns 500 when TTS server unreachable
- **Verified**: All frontend routes load correctly with authentication

### Frontend E2E Testing
- **Verified**: All 15 routes load without JavaScript errors (home, login, register, chat, chat-history, rag-documents, rag-queries, prompts, tools, skills, logs, monitor, debug, admin-users, admin-settings)
- **Verified**: Auth flow — login redirects to `/chat`, logout returns to `/login`, router guards enforce auth correctly
- **Verified**: Admin-only sections visible for admin users, hidden for regular users
- **Verified**: Backend API endpoints return expected `{"success": true/false, data/error}` responses

### Bug Fixes (Frontend QA Testing)

#### ChatSession Model
- **Fixed**: `src/models/ChatSession.js` - `message_count` virtual threw "Cannot read properties of undefined (reading 'length')" when using `.select('-messages')` in queries. Added null check `(this.messages || []).length`.

#### PrimeVue Toast Plugin
- **Fixed**: `frontend/src/main.js` - Added `ToastService` plugin registration (`app.use(ToastService)`) so `useToast()` composable works in ToolsView and SkillsView components. Previously threw "No PrimeVue Toast provided!" error.

#### Monitor Page API Calls
- **Fixed**: `frontend/src/views/monitor/SystemMonitorView.vue` - Changed raw `fetch()` calls to use `axios` with Bearer token from localStorage. Removed hardcoded `http://127.0.0.1:3000` URLs in favor of relative `/api/` paths.

#### CORS Configuration
- **Fixed**: `src/server.js` - Updated CORS to accept both `localhost:5173` and configured `FRONTEND_URL` origins. Previously only allowed a single hardcoded network IP, blocking all localhost requests.

#### Chat View Session Loading
- **Fixed**: `frontend/src/views/chat/ChatView.vue` - Added proper session loading on mount with error handling for empty state.
- **Fixed**: `frontend/src/stores/chat.js` - Added `response.data.data` to `sendMessage()` action for correct data extraction.

### Summary
| Category | Bugs Fixed |
|----------|-----------|
| ChatSession Model | 1 |
| PrimeVue Plugin | 1 |
| Monitor Page | 1 |
| CORS Config | 1 |
| Chat View | 2 |
| **Total** | **6** |

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
- **Added**: `src/tool/todo.js` — Task list management (add/complete/remove/list) persisted in session metadata
- **Added**: `src/models/ToolCall.js` — New model tracking tool calls with state machine (pending → running → completed/error)
- **Added**: `src/services/llamaService.js` — New `chatWithTools()` method passing `tools` array to Llama.cpp `/v1/chat/completions`
- **Added**: `src/services/chatService.js` — New `runLoop()` function implementing the tool-calling loop (up to 10 turns), `resolveTools()` for tool resolution, `getToolCalls()` endpoint
- **Added**: `src/controllers/chatController.js` — New `getToolCalls` and `getToolCall` endpoints
- **Modified**: `src/models/ChatSession.js` — Added `tool` role to message enum, `tool_calls` and `tool_call_id` fields, updated `addMessage()` to handle tool calls
- **Modified**: `src/routes/tool.js` — Reordered routes so `POST /call/:toolId` matches before `GET /:toolId`
- **Modified**: `src/controllers/toolController.js` — Rewired to use `toolService` for real execution
- **Modified**: `src/services/toolService.js` — Added real `callTool()` with Zod validation and `AsyncFunction` execution
- **Modified**: `src/workers/worker.js` — Added `bash` command execution via `child_process.spawn`
- **Modified**: `frontend/src/stores/chat.js` — New `sendMessage()` handling tool calls, `loadToolCalls()`, `loadToolCall()`
- **Modified**: `frontend/src/stores/tool.js` — Fixed execute endpoint to `/tools/call/${toolId}`
- **Modified**: `frontend/src/views/chat/ChatView.vue` — Added tool call display with collapsible tool results section

### Tool RBAC Access Control
- **Added**: `src/models/Tool.js` - New `roles` field (array, enum: `user`, `admin`, `system`, default `['user']`). Made `user_id` optional. Added `roles` index.
- **Added**: `src/services/toolService.js` - Replaced all ownership-based (`user_id`) queries with role-based queries using `{ roles: { $in: userRoles } }`. Renamed `getUserTools` to `getAccessibleTools`. Admin-only operations (update/delete) query by `_id` without role filtering.
- **Added**: `src/controllers/toolController.js` - Pass `req.user.roles` to service for read/call operations. Accept `roles` from request body in `createTool`. Return 403 for access-denied errors.
- **Added**: `src/routes/tool.js` - `POST /`, `PUT /:id`, `DELETE /:id` now use `rbac.requireAdmin`. `GET /`, `GET /:id`, `POST /call/:id` use `authMiddleware` with role-based service filtering.
- **Added**: `frontend/src/stores/tool.js` - Added `hasAdminRole` and `canExecuteTool` getters. All actions handle role-based access.
- **Added**: `frontend/src/views/tools/ToolsView.vue` - Role-gated buttons (New Tool/Edit/Delete for admin only, Execute gated by tool roles). Shows role badges on tool cards. Shows "Access denied" when user lacks role.
- **Fixed**: `src/services/toolService.js` - Tool code execution was failing for full function declarations. Added normalization to strip function wrapper before `AsyncFunction` evaluation.

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

---

## [Unreleased] - 2026-04-19

### Documentation Improvements

#### Documentation Structure
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
```

### Documentation Refactor & Model Config Update

- **Refactored**: Documentation functions (Chat, Document Group, Document Parser, Llama, Tool) reorganized into sub-pages for better clarity and maintenance.
- **Adjusted**: `integrations/llama/models/gemma-4-26B-A4B.sh` — reduced context size from 256k to 128k and decreased parallelism from 8 to 6 for stability.
- **Modified**: `src/server.js` — added `setupDatabase()` call to ensure schema/initialization runs on startup.
- **Added**: `integrations/opencode/skills/commit/` — new skill for committing and pushing the repo.
