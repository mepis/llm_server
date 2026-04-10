# Backend Refactoring Plan

**Date:** 2026-04-09  
**Project:** LLM Server (Node.js + Express + MongoDB)  
**Status:** ✅ Completed

---

## Overview

This document outlines the comprehensive refactoring plan to clean up and reorganize the LLM Server backend codebase. The goal is to eliminate redundancy, improve structure, and create a more maintainable codebase.

## Completed Tasks

- [x] **Phase 1:** Consolidated backend configs (database.js, db.js)
- [x] **Phase 2:** Created src/scripts/ and src/tests/ directories
- [x] **Phase 3:** Reorganized frontend views by domain
- [x] **Phase 4:** Cleaned root directory (moved screenshots, test files)
- [x] **Phase 5:** Updated AGENTS.md with new structure
- [x] **Phase 6:** Updated run_all.sh with new paths
- [x] **Phase 7:** Updated .gitignore for new directories

---

## Current Issues Identified

### 1. Duplicate/Redundant Files

#### Configuration Files
- `src/config/database.js` - Contains configuration settings (port, env, mongodb, jwt, llama, matrix, logging, sessionTimeout, maxFileSize)
- `src/config/db.js` - Contains database connection logic (imports from database.js)
- `src/utils/database.js` - Third copy with setup/cleanup functions

**Issue:** Three files serving similar purposes, causing confusion about which to use.

#### Utility Files
- `src/utils/database.js` - Duplicate connection logic
- `src/utils/jwt.js` - May be redundant with config
- `src/utils/security.js` - May be redundant

#### Scripts
- `scripts/uninstall_step_1.sh` and `scripts/uninstall_step_2.sh` - Likely duplicates
- `scripts/update_llama.sh` and `scripts/update_opencode.sh` - Similar patterns
- `scripts/install_opencode.sh` - May duplicate `integrations/opencode/`

### 2. Frontend Structure Issues

- `frontend/src/components/HelloWorld.vue` - Generic component, likely unused
- `frontend/src/components/auth/LoginKeypad.vue` - Auth logic in components folder
- `frontend/src/views/` - All 11 views in one folder, should be organized by domain

### 3. Root Directory Clutter

- 12 `.png` test screenshots (2-3MB each)
- `comprehensive_test.py` - Larger test file
- `test_all_frontend.py` - Possible duplicate
- `logs/` directory with large log files (21MB + 30MB)

### 4. Missing Structure (Referenced in AGENTS.md)

- `src/scripts/` - Referenced but doesn't exist
- `src/tests/` - Referenced but doesn't exist

### 5. 1:1 Layer Mapping Issues

- **Controllers:** 9 files (chat, llama, log, matrix, monitor, prompt, rag, tool, user)
- **Services:** 8 files (chat, llama, log, matrix, prompt, rag, tool, user)
- **Routes:** 10 files (api, chat, llama, log, matrix, monitor, prompt, rag, tool, user)

Most follow 1:1:1 pattern, but some may be consolidated.

---

## Proposed Refactoring Plan

### Phase 1: Consolidate Backend Configs

**Goal:** Create a single source of truth for configuration.

1. **Merge `database.js` and `db.js`**
   - Keep `src/config/database.js` for all configuration (port, env, mongodb, jwt, llama, matrix, logging, sessionTimeout, maxFileSize)
   - Keep `src/config/db.js` for connection management (connectDB, disconnectDB, getDB)
   - Remove `src/utils/database.js` - move functions to appropriate location

2. **Review `src/utils/` files**
   - `src/utils/jwt.js` - Check if needed or can be consolidated
   - `src/utils/security.js` - Check if needed or can be consolidated

3. **Review `src/config/rateLimiter.js`**
   - Check if used anywhere, if not, remove or integrate

4. **Review `src/config/workerPool.js`**
   - Check if `npm run worker` script uses it

### Phase 2: Reorganize Backend Code

**Goal:** Create consistent layering: `controllers` → `services` → `models`.

1. **Create `src/scripts/` for backend utilities**
   - Move `src/scripts/createAdmin.js` (referenced in package.json)
   - Move `src/scripts/testAll.js` (referenced in package.json)
   - Add any new utility scripts

2. **Review 1:1 mapping between layers**
   - Ensure each controller has corresponding service
   - Ensure each route has corresponding controller
   - Consolidate any duplicates

3. **Optimize imports**
   - Remove circular dependencies
   - Use consistent import patterns

### Phase 3: Clean Up Scripts

**Goal:** Organize and deduplicate shell scripts.

1. **Uninstall Scripts**
   - Compare `uninstall_step_1.sh` and `uninstall_step_2.sh`
   - Merge if identical, keep separate if different

2. **Update Scripts**
   - Compare `update_llama.sh` and `update_opencode.sh`
   - Create unified update script if patterns are similar

3. **Install Scripts**
   - Review `install_opencode.sh` vs `integrations/opencode/`
   - Consolidate if needed

4. **Model Runner Scripts**
   - Organize `scripts/models/` with clear naming
   - Consider creating `src/scripts/models/` for backend model management

### Phase 4: Organize Frontend

**Goal:** Improve frontend structure and remove unused files.

1. **Components**
   - Move `HelloWorld.vue` to `frontend/src/components/demo/` or delete
   - Move `LoginKeypad.vue` to `frontend/src/components/auth/`
   - Create domain-specific folders: `chat/`, `rag/`, `tools/`, `logs/`, `monitor/`, `prompts/`

2. **Views**
   - Create `frontend/src/views/auth/` - LoginView, RegisterView
   - Create `frontend/src/views/chat/` - ChatView, ChatHistoryView
   - Create `frontend/src/views/rag/` - RAGDocumentsView, RAGQueriesView
   - Create `frontend/src/views/tools/` - ToolsView
   - Create `frontend/src/views/monitor/` - SystemMonitorView
   - Create `frontend/src/views/logs/` - LogsView
   - Keep `HomeView.vue` in `frontend/src/views/home/`

3. **Stores**
   - Keep current structure (Pinia stores are fine as-is)
   - Consider domain-based organization if stores grow

4. **Composables**
   - Keep current structure (single composables is fine for now)

### Phase 5: Clean Root Directory

**Goal:** Organize root-level files and reduce clutter.

1. **Test Screenshot Files**
   - Create `test-results/` directory
   - Move all `.png` screenshots there
   - Update AGENTS.md references

2. **Test Files**
   - Compare `test_frontend.py` and `comprehensive_test.py`
   - If similar, merge into `src/tests/playwright/test-all.js` (or keep as-is)
   - If different, keep both with clear purposes

3. **Logs**
   - Keep `logs/` but add rotation policy documentation
   - Consider adding `.gitignore` for large log files

4. **Documentation**
   - Keep `docs/` as-is (well-organized)
   - Add `docs/refactoring/` for refactoring notes

5. **AGENTS.md Updates**
   - Update paths to reflect new structure
   - Update references to moved files

### Phase 6: Update Configuration Files

**Goal:** Ensure all config files reflect new structure.

1. **`package.json`**
   - Update script paths if changed
   - Add new scripts if created

2. **`.env` / `.env.example`**
   - Keep as-is (environment variables don't change)

3. **`frontend/vite.config.js`**
   - Update import aliases if structure changes

4. **`run_all.sh`**
   - Update paths to moved files

---

## Implementation Order

### Week 1: Backend Configuration & Core Structure
1. Consolidate config files (Phase 1)
2. Create `src/scripts/` and `src/tests/` directories
3. Move utility scripts to new locations

### Week 2: Backend Code Organization
4. Review and optimize controller/service/model layers
5. Fix any circular dependencies
6. Consolidate duplicate code

### Week 3: Scripts & Frontend
7. Clean up shell scripts
8. Reorganize frontend components and views
9. Remove or relocate unused files

### Week 4: Root Directory & Documentation
10. Organize root-level files
11. Update all configuration files
12. Update AGENTS.md and documentation

---

## Success Criteria

After refactoring:

1. **No duplicate configuration** - Single source of truth for each config
2. **Clear layer structure** - Controllers → Services → Models with 1:1:1 mapping
3. **Organized scripts** - All scripts in `scripts/` and `src/scripts/`
4. **Clean root directory** - Only essential files in root
5. **Well-organized frontend** - Domain-based folder structure
6. **Updated documentation** - AGENTS.md reflects new structure

---

## Risk Mitigation

1. **Test before changing** - Run tests after each phase
2. **Keep git history** - Commit after each major change
3. **Update references** - Ensure all imports/require statements are updated
4. **Back up config** - Keep `.env` and `.env.example` safe

---

## Files to Keep Track Of

### Critical (Must Update)
- `src/server.js` - Entry point
- `src/config/database.js` - Configuration
- `src/config/db.js` - Connection management
- `package.json` - Scripts and dependencies

### Important (Review)
- `src/routes/api.js` - API routes
- `src/middleware/auth.js`, `src/middleware/rbac.js` - Authentication
- `AGENTS.md` - Developer documentation

### Nice to Have
- `docs/` - Technical documentation
- `scripts/` - Shell scripts
- `logs/` - Application logs

---

## Quick Reference

### Before → After

| Before | After |
|--------|-------|
| `src/config/database.js` + `src/config/db.js` | Keep both (config + connection) |
| `src/utils/database.js` | Move to `src/config/db.js` or `src/scripts/` |
| `scripts/uninstall_step_1.sh` + `scripts/uninstall_step_2.sh` | Merge if identical |
| `src/components/HelloWorld.vue` | Move to `demo/` or delete |
| All `.png` files in root | Move to `test-results/` |
| `comprehensive_test.py` | Move to `src/tests/playwright/` |

---

**Status:** Ready for implementation  
**Author:** AGENTS  
**Version:** 1.0
