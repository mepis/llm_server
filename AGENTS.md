# AGENTS.md – Development Agent Guidelines

## 1. Build, Lint, and Test

### Build Commands
1. `npm run dev` – Starts Vite dev server with HMR.
2. `npm run build` – Produces production bundle in `dist/`.
3. `npm run preview` – Serves `dist/` locally for verification.

### Linting
1. `npm run lint` – Runs ESLint via `.eslintrc.cjs`.
2. `npm run format` – Runs Prettier on `*.js, *.ts, *.vue`.

### Testing
1. **Overall runner** – Vitest configured via `vitest.config.ts`; npm script `"test": "vitest run __tests__/"`.
2. **Single test** – `npx vitest run path/to/file.test.ts [--watch]`
   - Replace with relative path; `--watch` re‑runs on changes.
3. **Coverage** – `npx vitest run --coverage` (outputs to `coverage/`).
4. **Pattern filter** – `npx vitest run "src/**/my-feature.test.ts"`.

## 2. Code Style & Formatting

### Imports
- Prefer named imports.
- Group: external libraries, internal utils, component defs.
- Example:
  ```js
  import { ref, reactive } from 'vue';
  import { v4 as uuidv4 } from 'uuid';
  import { formatDate } from '@/utils/date';
  ```

### Files & Exports
- PascalCase for components & directories.
- camelCase for functions/variables.
- Single default export or named exports.
  ```js
  export const MyComponent = { /* ... */ };
  export function fetchData() { /* ... */ }
  ```

### Types
- Enable `strict` in `tsconfig.json`.
- Use interfaces for APIs, enums for groups.
- Avoid `any`; use `unknown` when unsure.

### Formatting
- 2‑space indentation, no tabs.
- ≤100 chars per line; wrap longer lines.
- Arrow functions for concise callbacks.
- No side‑effects in module scope.

### Error Handling
- Throw custom `AppError` for app‑specific errors.
- Catch at async boundaries, re‑throw with context.
  ```js
  async function loadData() {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new AppError('Network error', r.status);
      return await r.json();
    } catch (e) {
      throw new AppError('Load failed', e.message);
    }
  }
  ```

### Naming
- Functions: `camelCase`, verb for side‑effects (`loadUser`).
- Variables: descriptive `camelCase` (`userProfile`).
- Files: kebab‑case dirs, PascalCase entry points.
- Constants: `UPPER_SNAKE_CASE`.

### Docs
- JSDoc for all public APIs (`@param`, `@returns`, `@example`).
- Keep up‑to‑date, remove stale notes.

## 3. Cursor & Copilot Rules
- No `.cursor/rules/` or `.cursorrules` files.
- No `.github/copilot-instructions.md`; default Copilot behavior applies.
- Follow Prettier & ESLint rules from project dependencies.

## 4. General Development Practices
1. **Commit Messages** – Conventional commits, ≤72 chars.
2. **Pull Requests** – Clear description, change list, test notes.
3. **Code Review** – Address all comments; add commits, don’t amend.
4. **Dependency Updates** – Run `npm audit` & `npm outdated` first.
5. **Performance** – Profile with Vue Devtools; avoid unnecessary re‑renders (`v-memo`, `watchEffect`).

## 5. CI / Deployment
- GitHub Actions run `npm ci`, `npm run lint`, `npm test`.
- Minimum 80 % coverage for new code; failures block merges.
- Deploy via `npm run build && npm run preview` to `gh-pages`.
- Docker builds on tag; env vars from `.env.production`.

## 6. Security
- No secrets in repo; use GitHub Secrets.
- Validate all user inputs.
- CSP headers via server config; `helmet` for Express.

## 7. Pre‑commit Hooks
- Husky runs `npm run lint` and `npm run format -- --check`.
- Lint failures abort commit; fix and re‑stage.

## 8. Versioning
- Semantic Versioning: MAJOR, MINOR, PATCH.
- Tag with `vX.Y.Z` to trigger CI deployment.

## 9. FAQ
- **Single test?** `npx vitest run path/to/file.test.ts`.
- **Env vars location?** `.env.*` files; never commit secrets.
- **Manual Prettier?** `npm run format`.

## 10. Agent Configuration
- Agents read this file on startup for build/lint/test commands.
- `test` command executes a single test when requested.
- Agents must pass `npm run lint` before pushing.

## 11. Agent Logging
- Logs to `logs/agent.log` with timestamps.
- Errors sent to `#ops` Slack webhook.

## 12. Continuous Improvement
- Review quarterly; update linters, CI workflows.
- Solicit dev team feedback on style guide.

## 13. Environment Variables
- Use `.env.*` files at repository root.
- Prefix client‑exposed variables with `VITE_`.
- Secrets stay in GitHub Secrets; never push real keys.
- Access via `import.meta.env` in Vue/Vite projects.

## 14. Bundle Analysis
- Run `npm run build` then `npx source-map-explorer dist/*.js` to visualize dependencies.
- Spot large packages; replace with dynamic `import()` where possible.

## 15. Testing Best Practices
- Keep tests isolated and deterministic.
- Mock external services via `vi.mock()` or `vi.fn()`.
- Use descriptive `it` titles (`it('should fetch user data', ...)`).
- Generate per‑run coverage with `npm test -- --coverage`.

---  
*Generated for agentic coding assistants. Keep at repository root.*