# Sprint 2: Session Management System

**Duration:** 1 week  
**Phase:** Foundation (Phase 1)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand session management patterns
- Implement in-memory storage with Map
- Handle browser context lifecycle
- Practice timeout mechanisms
- Implement session IDs in UUID format that LLMs can easily parse and reference in subsequent calls
- Design session state tracking that LLMs can query for decision-making

## Goal

Implement the core session management with in-memory storage optimized for LLM session tracking.

## Deliverables

- Session creation, retrieval, and deletion endpoints
- Session storage with timeout cleanup
- Session isolation between LLM agents

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Design Session Storage

- [ ] Design session data structure:
  ```javascript
  {
    id: string,
    browser: 'chromium'|'firefox'|'webkit',
    contextId: string,
    createdAt: timestamp,
    lastUsedAt: timestamp,
    status: 'active'|'idle'|'closed',
    options: { headless, viewport, userAgent }
  }
  ```
- [ ] Create `src/services/session/SessionStorage.js`
- [ ] Implement in-memory storage with Map:
  ```javascript
  class SessionStorage {
    constructor() {
      this.sessions = new Map();
    }
    
    async createSession(options) {
      const sessionId = uuid.v4();
      const session = {
        id: sessionId,
        browser: options.browser || 'chromium',
        contextId: null,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        status: 'active',
        options
      };
      this.sessions.set(sessionId, session);
      return session;
    }
  }
  ```
- [ ] Create session cleanup utility with timeout

### Day 2: Session API Implementation

- [ ] Create `src/controllers/sessionController.js`
- [ ] Implement `POST /sessions` - Create new session
  ```javascript
  app.post('/sessions', async (req, res) => {
    try {
      const { browser = 'chromium', headless = true, viewport = { width: 1280, height: 720 } } = req.body;
      const session = await sessionService.createSession({ browser, headless, viewport });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  ```
- [ ] Implement `GET /sessions/:id` - Get session info
- [ ] Implement `DELETE /sessions/:id` - Close session
- [ ] Add session timeout logic with setInterval

### Day 3: Browser Context Integration

- [ ] Implement browser context creation per session
- [ ] Create page management per context
- [ ] Test concurrent sessions (create 3-5 sessions and verify isolation)

### Day 4-5: Testing & Refinement

- [ ] Write unit tests for SessionStorage
- [ ] Write integration tests for session endpoints
- [ ] Test concurrent session creation and cleanup
- [ ] Add session count limit (max 10 sessions)

## Pair Programming Recommendation

- Pair when implementing browser context creation (Day 3)
- Pair when testing concurrent sessions

## Troubleshooting Tips

- **Issue: Session cleanup not working** - Check if setInterval is running
- **Issue: Map operations failing** - Verify session exists before operations: `this.sessions.has(sessionId)`

## Acceptance Criteria

- Creating a session creates a new browser context
- Each session has unique ID
- Sessions timeout after inactivity
- Concurrent sessions work independently
- Cleanup on DELETE removes context
- Session responses include state information LLMs can use to track session lifecycle
- Session ID format is parseable and referenceable in subsequent API calls

## Next Sprint

[Sprint 3: Playwright Controller Foundation](./sprint-03-playwright-controller.md)

## Previous Sprint

[Sprint 1: Project Setup & Core Server](./sprint-01-project-setup.md)
