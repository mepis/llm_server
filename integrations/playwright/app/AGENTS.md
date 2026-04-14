# LLM Assistance API - Development Guide

## Quick Commands

```bash
# Start server (development)
npm run dev

# Start server (production)
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Install Playwright browsers (required!)
npx playwright install chromium
```

## Critical Setup

1. **Playwright browsers must be installed** - API will fail without them:

   ```bash
   npx playwright install chromium  # or firefox, webkit
   ```

2. **Module system**: CommonJS only - do not change `"type": "commonjs"` in package.json

3. **Port**: Default is 3000, configurable via `PORT` env var

## Architecture

- **Entry point**: `src/index.js`
- **Session management**: `src/services/session/SessionStorage.js` + `PlaywrightService.js`
- **Browser controller**: `src/controllers/playwright/PlaywrightController.js`
- **API docs**: Swagger UI at `/docs` endpoint
- **Tests**: `src/tests/**/*.test.js`

## Test Patterns

- Tests use `require("../index")` for app imports in integration tests
- Session tests clear `sessionStorage.sessions.clear()` in beforeEach
- Browser tests require Playwright browsers installed
- Coverage threshold: 50% (not 80%) - configured in jest.config.js
- Test timeout: 30 seconds per test

## API Response Pattern

All responses follow consistent format for LLM parsing:

```json
{
  "success": true,
  "data": {
    /* response data */
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "actionable error message for self-recovery"
}
```

## Session Lifecycle

1. `POST /sessions` - Create session with UUID
2. Use `sessionId` in all subsequent calls: `/sessions/:id/*`
3. `DELETE /sessions/:id` - Clean up browser resources

## Known Gotchas

- **Firefox test failures**: Requires `npx playwright install firefox`
- **Rate limiting**: 100 requests per 60 seconds per session (configurable via `RATE_LIMIT_MAX`)
- **Navigation timeout**: Default 30 seconds
- **Type operation timeout**: 5 second limit to prevent hangs

## Environment Variables

| Variable         | Default  | Description          |
| ---------------- | -------- | -------------------- |
| `PORT`           | 3000     | Server port          |
| `BROWSER`        | chromium | Browser type         |
| `HEADLESS`       | true     | Headless mode        |
| `CORS_ORIGIN`    | \*       | CORS allowed origins |
| `RATE_LIMIT_MAX` | 100      | Requests per window  |

## Common Patterns for LLMs

1. **Research workflow**: navigate → extract content → analyze → decide next action
2. **Error recovery**: Check `success: false`, read error message, adjust parameters
3. **Session cleanup**: Always DELETE sessions after use to free browser resources
4. **Multi-step tasks**: Use session ID consistently across all tool calls

## Documentation Quick Reference

- **Getting Started**: [docs/index.md](./docs/index.md)
- **Feature Docs**: [docs/features/](./docs/features/) (session-management, navigation, interaction, extraction, form-handling, advanced-features, javascript-execution)
- **Technical Docs**: [docs/technical/](./docs/technical/) (api-reference, configuration, security)
- **QA Examples**: [docs/qa/](./docs/qa/) (basic-workflows, research-task, form-submission)
- **Architecture**: [docs/architecture/overview.md](./docs/architecture/overview.md)
- **Tags Index**: [docs/tags/index.md](./docs/tags/index.md)
