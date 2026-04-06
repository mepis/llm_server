# System Monitoring

This document covers the system monitoring capabilities in LLM Server, including log management, health checks, performance metrics, and system status monitoring.

---

## Overview

The system monitoring system provides comprehensive observability for the LLM Server application. Key capabilities include:

- Log collection and querying
- System health checks
- Performance metrics collection
- Worker thread monitoring
- Database connection monitoring
- Llama.cpp server status

### Monitoring Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Monitoring Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Winston     │                                               │
│  │  Logger      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Log         │                                               │
│  │  Collection  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  MongoDB     │                                               │
│  │  Logs        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Log         │                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Query &     │                                               │
│  │  Filter      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  logs        │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Health      │                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check       │                                               │
│  │  MongoDB     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check       │                                               │
│  │  Llama.cpp   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Check       │                                               │
│  │  Workers     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  status      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Log Management

### Log Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Log Schema                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  log_level   │  String (error, warn, info, debug)           │
│  │  service     │  String (service name)                       │
│  │  message     │  String (log message)                        │
│  │  metadata    │  Object (log metadata)                       │
│  │  timestamp   │  Timestamp                                    │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Metadata    │  ┌──────────────┐                            │
│  │  []          │  │  request_id  │  String                      │
│  │              │  │  user_id     │  ObjectId                   │
│  │              │  │  path        │  String                     │
│  │              │  │  method      │  String                     │
│  │              │  │  response_time│ Number                     │
│  │              │  │  status_code │  Number                     │
│  │              │  │  error_stack │  String                     │
│  │              │  │  additional  │  Object                     │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `error` | Critical errors | System failures |
| `warn` | Warnings | Potential issues |
| `info` | Informational | Normal operations |
| `debug` | Debug information | Development/debugging |

### Log Querying

```
┌─────────────────────────────────────────────────────────────────┐
│                      Log Querying                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  GET /api/   │                                               │
│  │  logs        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Query       │                                               │
│  │  parameters  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Filter by   │                                               │
│  │  level       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Filter by   │                                               │
│  │  service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Filter by   │                                               │
│  │  timestamp   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Limit       │                                               │
│  │  results     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  logs        │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Health Checks

### Health Check Endpoint

```
GET /api/monitor/health
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-04-03T10:30:00Z",
    "uptime": 86400,
    "cpu_usage": 25.5,
    "memory_usage": 512,
    "database_connection": "connected",
    "llama_cpp_status": "running",
    "active_workers": 3
  }
}
```

### Health Check Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Health Check Components                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Server      │                                               │
│  │  Status      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  MongoDB     │                                               │
│  │  Connection  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  Server      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  Pool        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  System      │                                               │
│  │  Resources   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Metrics

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Metrics                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Requests    │                                               │
│  │  per         │                                               │
│  │  second      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Average     │                                               │
│  │  response    │                                               │
│  │  time        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Error       │                                               │
│  │  rate        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  queue       │                                               │
│  │  length      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Database    │                                               │
│  │  queries     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama       │                                               │
│  │  inferences  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Endpoint

```
GET /api/monitor/performance
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "requests_per_second": 150,
    "average_response_time_ms": 245,
    "error_rate": 0.01,
    "worker_queue_length": 5,
    "database_queries_per_second": 50,
    "llama_inferences_per_second": 10
  }
}
```

---

## Worker Monitoring

### Worker Pool Status

```
┌─────────────────────────────────────────────────────────────────┐
│                    Worker Pool Status                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Min Threads│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Max Threads│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Active      │                                               │
│  │  Workers     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Queue       │                                               │
│  │  Length      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Idle        │                                               │
│  │  Timeout     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Monitoring Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/logs` | Get logs | Admin |
| GET | `/api/logs/level/:level` | Get logs by level | Admin |
| GET | `/api/logs/user/:id` | Get user logs | Yes |
| GET | `/api/logs/stats` | Get log stats | Admin |
| GET | `/api/monitor/health` | Health check | Admin |
| GET | `/api/monitor/performance` | Performance metrics | Admin |

---

## Tags

- `monitoring` - System monitoring and logging
- `admin` - Administrative privileges
- `logging` - Application logging
- `system` - System-level operations

---

## Related Documentation

- [System Monitoring](./system-monitoring.md) - Monitoring capabilities
- [Worker Threads](../architecture/worker-threads.md) - Worker pool implementation
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Get Recent Logs

```javascript
async function getRecentLogs(level = 'info', limit = 100) {
  const db = await getDB();
  
  const logs = await db.collection('logs')
    .find({
      log_level: level,
      timestamp: { $gte: new Date(Date.now() - 3600000) }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return logs;
}
```

### Example 2: Check System Health

```javascript
async function checkSystemHealth() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cpu_usage: 0,
    memory_usage: 0,
    database_connection: 'disconnected',
    llama_cpp_status: 'unknown',
    active_workers: 0
  };
  
  // Check MongoDB
  try {
    await db.admin().ping();
    health.database_connection = 'connected';
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  // Check Llama.cpp
  try {
    await fetch(LLAMA_SERVER_URL + '/v1/models');
    health.llama_cpp_status = 'running';
  } catch (error) {
    health.status = 'unhealthy';
  }
  
  // Check workers
  health.active_workers = piscina.workingThreads + piscina.idleThreads;
  
  return health;
}
```

### Example 3: Get Performance Metrics

```javascript
async function getPerformanceMetrics() {
  const startTime = Date.now();
  
  // Simulate metrics collection
  const metrics = {
    requests_per_second: 150,
    average_response_time_ms: 245,
    error_rate: 0.01,
    worker_queue_length: 5,
    database_queries_per_second: 50,
    llama_inferences_per_second: 10
  };
  
  const executionTime = Date.now() - startTime;
  
  return {
    ...metrics,
    collection_time_ms: executionTime
  };
}
```
