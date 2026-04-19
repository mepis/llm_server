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

---

### Summary

| Category | Bugs Fixed |
|----------|-----------|
| Authentication | 3 |
| Chat | 2 |
| Database Models | 3 |
| Pinia Stores | 9 |
| UI Components | 1 |
| Views | 1 |
| **Total** | **19** |
