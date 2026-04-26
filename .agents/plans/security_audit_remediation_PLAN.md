# Implementation Plan: Security Audit Remediation

## Purpose
The goal of this project is to identify and remediate critical security vulnerabilities within the LLM Server codebase, focusing on command injection, broken object-level authorization (BOLA), information leaks, inconsistent input validation, and hardcoded secrets. The ultimate outcome is a more robust, secure, and maintainable backend architecture.

## Progress
- [ ] **Phase 1: Critical Fixes** - *pending*
- [ ] **Phase 2: Robustness** - *pending*
- [ ] **Phase 3: Refactoring & Cleanup** - *pending*

## Decision Log
| Date | Decision | Reason | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| 2026-04-25 | Use Zod for validation in `userService.js` | Provides schema-based, type-safe validation and automatic error generation. | Joi, manual checks |
| 2026-04-25 | Remove `{ shell: true }` in worker threads | Prevents command injection by forcing argument array usage. | Sanitizing input strings (harder to get right) |
| 2026-04-25 | Use `authorize(['admin'])` middleware for `getAllUsers` | Enforces strict RBAC to prevent BOLA/Privilege Escalation. | Manual role check inside controller |

## Phases

### Phase 1: Critical Fixes
*Focus: Remediate high-impact vulnerabilities that can be actively exploited.*

**Tasks:**
- [ ] **[VULN-001] Sanitize Worker Thread Command Execution**
    - [ ] Modify `src/workers/worker.js` to replace `spawn(command, { shell: true, ... })` with `spawn(command, args, { shell: false, ... })`.
    - [ ] Update the `executeBash` function to accept an array of arguments instead of a single command string.
    - [ ] **Validation**: Verify via unit test that a command like `; rm -rf /` fails or is treated as a literal argument rather than an executed command.
- [ ] **[VULN-002] Fix BOLA in `getAllUsers`**
    - [ ] Locate `router.get('/', userController.getAllUsers)` in `src/routes/user.js`.
    - [ ] Apply `rbac.requireAdmin` middleware to this route.
    - [ ] **Validation**: Attempt to call `/api/users/` with a non-admin JWT and ensure a 403 Forbidden response is returned.

**Phase 1 Done Criteria:**
- L1: All tasks marked complete.
- L2: All new tests pass in the `src/tests/testAll.js` suite.
- L3: No regression in existing user authentication flows.

### Phase 2: Robustness
*Focus: Enhance data integrity and prevent information disclosure.*

**Tasks:**
- [ ] **[V003] Sanitize RAG Metadata Error Messages**
    - [ ] In `src/services/ragService.js`, identify error logging/storage points (e.g., line 56).
    - [ ] Implement a sanitization function to strip sensitive system paths or internal stack traces from `errorMessage` before it is saved to the `metadata` JSON column in `rag_documents`.
    - [．**Validation**: Inspect the `rag_documents` table after a failed parse to ensure error messages don't contain local file system paths.
- [ ] **[V005] Implement Zod Validation for `updateUser`**
    - [ ] Install/Verify `zod` availability in `package.json`.
    - [ ] Define a `userUpdateSchema` in `src/services/userService.js`.
    - [ ] Integrate `.parse()` within the `updateUser` function to validate `updateData`.
    - [**Validation**: Send an invalid payload (e.g., wrong type for `email`) and verify the server returns a structured validation error.

**Phase 2 Done Criteria:**
- L1: All tasks marked complete.
- L2: Schema validation errors are caught and returned as standard API responses.
- L3: RAG metadata remains clean of system-specific leakages.

### Phase 3: Refactoring & Cleanup
*Focus: Long-term architectural health and secret management.*

**Tasks:**
- [ ] **[V004] Refactor Chat Sessions (Long Term)**
    - [ ] Design a migration plan to move chat message content from the `chat_sessions` JSON column to a new `chat_messages` table.
    - [ ] Create Knex migration files for the new schema.
    - [**Validation**: Verify that messages can be retrieved correctly via the new relational structure.
- [ ] **[V006] Clean up Hardcoded Secrets**
    - [ ] Audit integration files (e.g., `src/config/`, `src/services/`) for hardcoded strings like `localhost` or default passwords.
    - [ ] Move all discovered secrets to `.env` and reference them via `process.env`.
    - [**Validation**: Ensure no sensitive keys are present in the codebase using a simple `grep` check.

**Phase 3 Done Criteria:**
- L1: All tasks marked complete.
- L2: The database schema is updated and migrations run successfully.
- L3: Environment variables are used exclusively for configuration.
