# Configuration Guide

This document covers the configuration of LLM Server, including environment variables, rate limiting, worker pool settings, and deployment configurations.

---

## Overview

Proper configuration is essential for LLM Server to function correctly. This guide covers all configuration options, environment variables, and best practices.

### Configuration Files

```
┌─────────────────────────────────────────────────────────────────┐
│                    Configuration Files                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  .env       │  Environment variables (local)                │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  .env.example│  Template with descriptions                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  package.json│  npm dependencies                            │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  config/     │  Runtime configuration                       │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | 3000 | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `LLAMA_SERVER_URL` | Yes | - | Llama.cpp server URL |

### Optional Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment (development/production) |
| `JWT_EXPIRES_IN` | No | 7d | JWT token expiration |
| `LOG_LEVEL` | No | info | Logging level |
| `LOG_FORMAT` | No | combined | Log format (combined/json) |
| `MAX_FILE_SIZE` | No | 10485760 | Maximum upload size (bytes) |
| `SESSION_TIMEOUT` | No | 86400000 | Session timeout (ms) |

### Example .env File

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/llm_server
MONGODB_OPTIONS=socketTimeoutMS=30000,connectTimeoutMS=10000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Llama.cpp
LLAMA_SERVER_URL=http://localhost:8082
LLAMA_TIMEOUT=30000

# Matrix Integration
MATRIX_HOMESERVER=https://matrix.org
MATRIX_ACCESS_TOKEN=your-matrix-token
MATRIX_USER_ID=your-matrix-user-id

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Session & Files
SESSION_TIMEOUT=86400000
MAX_FILE_SIZE=10485760
```

---

## Database Configuration

### MongoDB Connection

#### Connection Pool Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│              Database Connection Pool Lifecycle                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  App Starts  │                                               │
│  │  (Server)    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Connect     │                                               │
│  │  to MongoDB  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create      │                                               │
│  │  Pool        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Pool Ready  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Server     │                                               │
│  │  Starts      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  App Stops   │                                               │
│  │  (Cleanup)   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Close      │                                               │
│  │  Pool        │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

**Lifecycle Stages:**
1. **App Starts**: Server initialization begins
2. **Connect to MongoDB**: Establishes initial connection
3. **Create Pool**: Initializes connection pool with settings
4. **Pool Ready**: Pool is configured and available
5. **Server Starts**: Application server starts listening
6. **App Stops**: Graceful shutdown initiated
7. **Close Pool**: Releases all connections before exit

**Key Points:**
- Pool size: 10 connections (configurable via `maxPoolSize`)
- Timeout: 30s socket timeout, 10s connect timeout
- Connections are reused across requests
- Pool auto-reconnects on connection failures
- Cleanup happens during graceful shutdown
```

#### Connection String Examples

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/llm_server

# Docker MongoDB
MONGODB_URI=mongodb://mongodb:27017/llm_server

# Replica Set
MONGODB_URI=mongodb://replica1:27017,replica2:27017,replica3:27017/llm_server?replicaSet=rs0

# With Authentication
MONGODB_URI=mongodb://username:password@localhost:27017/llm_server?authSource=admin
```

---

## Rate Limiting Configuration

### Rate Limit Settings

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Limiting                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  API Limiter│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Window      │  15 minutes                                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Max        │  100 requests                                  │
│  │  requests   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Auth Limiter│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Window      │  15 minutes                                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Max        │  5 requests                                    │
│  │  requests   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Registration Limiter│                                    │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Window      │  24 hours                                     │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Max        │  3 requests                                    │
│  │  requests   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Worker Pool Configuration

### Piscina Settings

```
┌─────────────────────────────────────────────────────────────────┐
│                    Worker Pool Configuration                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  minThreads  │  2                                           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  maxThreads  │  4                                           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  idleTimeout  │  30000ms                                    │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  maxTasks    │  1000                                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  resourceLimits│                                           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  maxOldGen  │  2048ms                                       │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  maxYoung   │  1024ms                                       │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Worker Configuration

```javascript
const { Piscina } = require('piscina');

const piscina = new Piscina({
  filename: path.join(__dirname, './src/workers/worker.js'),
  minThreads: 2,
  maxThreads: 4,
  idleTimeout: 30000,
  maxTasksPerWorker: 1000,
  resourceLimits: {
    maxOldGenerationSizeMs: 2048,
    maxYoungGenerationSizeMs: 1024
  },
  workerData: {
    llamaServerUrl: 'http://localhost:8082'
  }
});
```

---

## CORS Configuration

### CORS Settings

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORS Configuration                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  allowedOrigins│  ['http://localhost:5173']                 │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  allowedMethods│ ['GET', 'POST', 'PUT', 'DELETE']          │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  allowedHeaders│ ['Content-Type', 'Authorization']         │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  credentials  │  true                                       │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Logging Configuration

### Winston Logger Settings

```
┌─────────────────────────────────────────────────────────────────┐
│                    Logging Configuration                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  LOG_LEVEL   │  info                                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  LOG_FORMAT  │  combined                                     │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Transports  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Console     │  │  File        │                            │
│  │              │  │              │                            │
│  └──────────────┘  │  error.log   │                            │
│                    │  combined.log│                            │
│                    └──────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Log Levels

| Level | Description | Color |
|-------|-------------|-------|
| `error` | Critical errors | Red |
| `warn` | Warnings | Yellow |
| `info` | Informational | White |
| `debug` | Debug information | Blue |

---

## File Upload Configuration

### Upload Settings

```
┌─────────────────────────────────────────────────────────────────┐
│                    File Upload Configuration                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  MAX_FILE_SIZE│  10485760 (10MB)                           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Allowed Types│                                            │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  pdf, txt,   │  Supported file types                        │
│  │  doc, docx,  │                                               │
│  │  md, json,   │                                               │
│  │  csv         │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tags

### Core
- `configuration` - Configuration guide
- `environment` - Environment variables
- `deployment` - Deployment settings

### Technical
- `caching` - Response caching strategies
- `streaming` - Response streaming flow
- `pagination` - Data pagination patterns
- `batch-operations` - Bulk user operations
- `query-optimization` - Database query optimization

### Workflow
- `workflows` - Multi-step workflows
- `multi-turn-chat` - Conversation management
- `complete-pipeline` - End-to-end pipeline
- `retry-patterns` - Retry logic and backoff

---

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - Production deployment
- [Performance Guide](./performance-guide.md) - Optimization
- [Troubleshooting](./troubleshooting.md) - Common issues
