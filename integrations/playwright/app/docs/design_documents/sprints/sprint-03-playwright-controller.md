# Sprint 3: Playwright Controller Foundation

**Duration:** 1 week  
**Phase:** Foundation (Phase 1)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's browser lifecycle
- Implement class-based controller pattern
- Handle asynchronous browser operations
- Create robust error handling
- Create controller methods with predictable return structures LLMs can depend on for chaining operations
- Implement error messages that are actionable for LLM self-correction

## Goal

Create the Playwright controller wrapper for browser lifecycle management with LLM-friendly error handling.

## Deliverables

- Playwright controller class
- Browser launch and context management
- Error handling for browser operations

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Controller integrates with session storage
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Controller Design

- [ ] Create `src/controllers/playwright/PlaywrightController.js`
- [ ] Design controller interface with methods:
  ```javascript
  class PlaywrightController {
    constructor() {
      this.browser = null;
      this.context = null;
      this.page = null;
    }
    
    async launch() { /* ... */ }
    async createContext() { /* ... */ }
    async createPage() { /* ... */ }
    async close() { /* ... */ }
  }
  ```

### Day 2-3: Browser Lifecycle Implementation

- [ ] Implement browser launch with configurable options:
  ```javascript
  async launch(options = {}) {
    const { headless = true, slowMo = 0 } = options;
    this.browser = await playwright[this.options.browser].launch({
      headless: headless,
      slowMo: slowMo,
      timeout: 60000
    });
    console.log(`Browser launched: ${this.options.browser}`);
  }
  ```
- [ ] Implement context creation with isolation:
  ```javascript
  async createContext(options = {}) {
    if (!this.browser) {
      throw new Error('Browser not launched');
    }
    this.context = await this.browser.newContext({
      viewport: options.viewport,
      userAgent: options.userAgent,
      ...options
    });
    return this.context;
  }
  ```
- [ ] Implement page management
- [ ] Add graceful shutdown with `process.on('SIGINT')`

### Day 4: Error Handling & Retry

- [ ] Implement retry logic for flaky operations:
  ```javascript
  async withRetry(operation, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      }
    }
  }
  ```
- [ ] Add timeout handling for all async operations
- [ ] Create browser crash detection

### Day 5: Integration & Testing

- [ ] Integrate with session storage
- [ ] Write unit tests for controller methods
- [ ] Test browser launch/close lifecycle
- [ ] Test concurrent browser operations

## Pair Programming Recommendation

- Pair when implementing browser launch (Day 2-3)
- Pair when implementing retry logic (Day 4)

## Troubleshooting Tips

- **Issue: Browser fails to launch** - Check Node.js version compatibility, verify Playwright browser installation: `npx playwright install --with-deps`
- **Issue: Context creation fails** - Ensure browser is launched first, check browser type matches
- **Issue: Page creation fails** - Ensure context exists, check viewport size

## Acceptance Criteria

- Browser launches successfully
- Context creation works
- Pages can be created and managed
- Errors are caught and reported
- Browser closes on shutdown
- Error messages are descriptive enough for LLMs to understand failure reasons
- Retry logic handles transient failures that LLMs might encounter

## Next Sprint

[Sprint 4: Navigation & Interaction Tools](./sprint-04-navigation-interaction.md)

## Previous Sprint

[Sprint 2: Session Management System](./sprint-02-session-management.md)
