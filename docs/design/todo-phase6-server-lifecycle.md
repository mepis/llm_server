# Phase 6: Update Server Lifecycle (server.js)

## Goal
Update `src/server.js` to spawn the Chatterbox Python gRPC service on startup, wait for it to become healthy, initialize the Node.js gRPC client, and handle graceful shutdown on SIGTERM/SIGINT signals.

---

## Todo Items

### 6.1 — Add import for Chatterbox lifecycle functions

**File path:** `/home/jon/git/llm_server/src/server.js`

**Current imports (lines 1-10):**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/database');
const db = require('./config/db');
const logger = require('../utils/logger');
const rateLimiter = require('./config/rateLimiter');
const { validateEnvironment } = require('../utils/environment');
```

**Action:** Add this import after line 10 (after the `validateEnvironment` import):
```javascript
const { spawnChatterboxService, initChatterboxClient, waitForChatterboxHealth, shutdownChatterboxService } = require('./services/llamaService');
```

**Verify:**
- Import statement present on line 11 or after line 10
- All 4 functions destructured: `spawnChatterboxService`, `initChatterboxClient`, `waitForChatterboxHealth`, `shutdownChatterboxService`

---

### 6.2 — Replace the `startServer` function

**File path:** `/home/jon/git/llm_server/src/server.js`

**Current `startServer` function (lines 52-64):**
```javascript
const startServer = async () => {
  try {
    await db.connectDB();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

**Action:** Replace the entire `startServer` function and its call with:

```javascript
const startServer = async () => {
  try {
    await db.connectDB();

    // Start Chatterbox TTS service
    logger.info('Initializing Chatterbox TTS service...');
    const serviceStarted = spawnChatterboxService();

    if (serviceStarted) {
      const healthy = await waitForChatterboxHealth();
      if (!healthy) {
        logger.warn('Chatterbox service failed to become healthy. TTS will not be available.');
      } else {
        initChatterboxClient();
      }
    } else {
      logger.warn('Failed to spawn Chatterbox service. TTS will not be available.');
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  shutdownChatterboxService();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  shutdownChatterboxService();
  process.exit(0);
});
```

**Verify:**
- `startServer` function now calls `spawnChatterboxService()` after DB connection
- `waitForChatterboxHealth()` is awaited (async/await pattern)
- If healthy, `initChatterboxClient()` is called
- Warning logged if service fails to start or become healthy
- Express server starts regardless of Chatterbox health (graceful degradation)
- Two signal handlers added: SIGTERM and SIGINT
- Both handlers call `shutdownChatterboxService()` before `process.exit(0)`

---

## Phase 6 Completion Checklist

Before moving to Phase 7, verify all of the following:

- [ ] Import statement for Chatterbox lifecycle functions present (4 functions destructured)
- [ ] `startServer` calls `spawnChatterboxService()` after `db.connectDB()`
- [ ] `waitForChatterboxHealth()` is awaited with proper if/else handling
- [ ] `initChatterboxClient()` called only when service is healthy
- [ ] Warning messages logged for both spawn failure and health check failure
- [ ] Express server starts regardless of Chatterbox status (graceful degradation)
- [ ] SIGTERM handler present, calls `shutdownChatterboxService()`, then `process.exit(0)`
- [ ] SIGINT handler present, calls `shutdownChatterboxService()`, then `process.exit(0)`
- [ ] File passes syntax check: `node -c src/server.js` returns no errors
