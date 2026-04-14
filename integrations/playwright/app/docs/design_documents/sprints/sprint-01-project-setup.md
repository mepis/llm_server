# Sprint 1: Project Setup & Core Server

**Duration:** 1 week  
**Phase:** Foundation (Phase 1)  
**Status:** ⏳ Pending

## Learning Objectives

- Set up a Node.js/Express.js project
- Understand middleware in Express
- Configure npm scripts
- Create basic directory structure
- Design API endpoints with consistent verb/noun patterns that LLMs can reliably map to intentions

## Goal

Establish the foundation with dependencies, server skeleton, and basic routing optimized for LLM tool calling.

## Deliverables

- Working Express.js server on port 3000
- Basic health check endpoint
- Project dependencies installed
- Directory structure created

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Initialize Project

- [ ] Initialize npm project: `npm init -y`
- [ ] Install Express.js: `npm install express`
- [ ] Install Playwright: `npm install @playwright/test`
- [ ] Install utility packages: `npm install uuid cors`
- [ ] Verify installation: `npm list`

### Day 2: Configure Scripts

- [ ] Update `package.json` with proper scripts:
  ```json
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "lint": "eslint .",
    "test:coverage": "jest --coverage"
  }
  ```
- [ ] Install development dependencies: `npm install --save-dev jest supertest eslint prettier`
- [ ] Create `.gitignore` file

### Day 3: Create Directory Structure

- [ ] Create `src/index.js` as entry point
- [ ] Create `src/config/` directory for configuration
- [ ] Create `src/controllers/` directory
- [ ] Create `src/services/` directory
- [ ] Create `src/constants/` directory for constants
- [ ] Create `src/tests/` directory

### Day 4-5: Server Skeleton

- [ ] Create `src/index.js` with Express app and middleware:
  ```javascript
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors());
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  ```
- [ ] Create base response helper function in `src/utils/response.js`
- [ ] Set up Jest configuration in `jest.config.js`
- [ ] Create basic server integration test in `src/tests/server.test.js`

## Acceptance Criteria

- Server starts with `npm start`
- `GET /health` returns `{"status": "ok"}`
- No console errors
- Dependencies installed successfully
- API endpoints follow consistent REST patterns (noun-based URLs, standard HTTP verbs)
- Response format is consistent across all endpoints (success flag, data, error structure)

## Troubleshooting Tips

- **Issue: Port already in use** - Check what's using port 3000: `lsof -i :3000` or `netstat -tulpn | grep 3000`
- **Issue: Playwright browser installation fails** - Run: `npx playwright install --with-deps`
- **Issue: Module not found errors** - Run: `npm install` again to ensure all dependencies are installed

## LLM-Specific Troubleshooting

- **Issue: LLM repeatedly fails at navigation** - Check if URL format is correct, verify waitUntil option
- **Issue: LLM misinterprets error messages** - Review error message clarity, add more context
- **Issue: LLM loses session context** - Verify session ID is included in all responses
- **Issue: LLM doesn't retry on transient errors** - Check error codes distinguish transient vs permanent failures

## Next Sprint

[Sprint 2: Session Management System](./sprint-02-session-management.md)

## Previous Sprint

[Sprint Plan Index](../sprint_plan.md)
