# Worker Threads

This document covers the worker thread implementation using Piscina for offloading heavy tasks like password hashing, LLM inference, and document processing.

---

## Overview

The worker thread pool uses Node.js's `piscina` library to offload CPU-intensive tasks from the main thread, improving application responsiveness and throughput.

### Worker Pool Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Worker Pool Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Main Thread│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Express     │                                               │
│  │  Server      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Receive     │                                               │
│  │  message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  task        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  worker      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  Thread      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Execute     │                                               │
│  │  task        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  result      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Piscina Configuration

### Configuration Object

```javascript
// src/config/workerPool.js
const { Piscina } = require('piscina');

const piscina = new Piscina({
  filename: path.join(__dirname, '../workers/worker.js'),
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

### Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `filename` | worker.js | Worker file path |
| `minThreads` | 2 | Minimum active threads |
| `maxThreads` | 4 | Maximum active threads |
| `idleTimeout` | 30s | Thread idle timeout |
| `maxTasksPerWorker` | 1000 | Max tasks per worker |
| `resourceLimits` | Memory limits | V8 heap size limits |
| `workerData` | Llama URL | Data passed to workers |

---

## Task Types

### Supported Task Types

| Type | Description | Handler |
|------|-------------|---------|
| `hash-password` | Hash password with Argon2 | `hashPassword()` |
| `verify-password` | Verify password hash | `verifyPassword()` |
| `llm-inference` | LLM chat completion | `llmInference()` |
| `generate-embeddings` | Generate vector embeddings | `generateEmbeddings()` |
| `rag-process` | Process RAG document | `processRAG()` |
| `rag-search` | Search RAG documents | `ragSearch()` |
| `health-check` | Check Llama.cpp health | `checkHealth()` |

### Task Message Format

```
┌─────────────────────────────────────────────────────────────────┐
│                    Task Message Format                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Task        │                                               │
│  │  Message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  {           │                                               │
│  │    type:     │  Task identifier                              │
│  │    data:     │  Task-specific data                           │
│  │    requestId:│  Request identifier                           │
│  │  }           │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Response    │                                               │
│  │  Message     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  {           │                                               │
│  │    requestId:│  Matching request ID                         │
│  │    success:  │  Success status                               │
│  │    data:     │  Result data (if success)                     │
│  │    error:    │  Error message (if failed)                    │
│  │  }           │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Worker Implementation

### Worker File Structure

```javascript
// src/workers/worker.js
const { parentPort, workerData } = require('worker_threads');
const { exec } = require('child_process');

// LLM Inference Task
async function llmInference(req) {
  const llamaUrl = workerData.llamaServerUrl;
  
  const response = await fetch(`${llamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Embedding Task
async function generateEmbeddings(req) {
  const llamaUrl = workerData.llamaServerUrl;
  
  const response = await fetch(`${llamaUrl}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  
  return response.json();
}

// RAG Processing Task
async function processRAG(fileBuffer) {
  // Extract text from file
  // Chunk content
  // Generate embeddings
  // Store in database
}

// Health Check Task
async function checkHealth() {
  const llamaUrl = workerData.llamaServerUrl;
  
  const response = await fetch(`${llamaUrl}/v1/models`);
  
  return {
    status: response.ok ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  };
}

// Main message handler
parentPort.on('message', async ({ type, data, requestId }) => {
  try {
    let result;
    
    switch (type) {
      case 'llm-inference':
        result = await llmInference(data);
        break;
      case 'generate-embeddings':
        result = await generateEmbeddings(data);
        break;
      case 'rag-process':
        result = await processRAG(data);
        break;
      case 'health-check':
        result = await checkHealth();
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    parentPort.postMessage({
      requestId,
      success: true,
      data: result
    });
  } catch (error) {
    parentPort.postMessage({
      requestId,
      success: false,
      error: error.message
    });
  }
});
```

---

## Worker Pool Management

### Pool Statistics

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pool Statistics                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Active      │  Workers currently executing tasks            │
│  │  Threads     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Idle        │  Workers waiting for tasks                    │
│  │  Threads     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Waiting     │  Tasks in queue                              │
│  │  Queue       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Total       │  Sum of active and idle threads              │
│  │  Threads     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pool Methods

```javascript
// Get pool statistics
console.log('Active threads:', piscina.workingThreads);
console.log('Idle threads:', piscina.idleThreads);
console.log('Waiting tasks:', piscina.waitingTasks);

// Run task
const result = await piscina.run({
  type: 'llm-inference',
  data: {
    model: 'llama-3-8b',
    messages: [...]
  },
  requestId: crypto.randomUUID()
});

// Terminate pool
await piscina.terminate();
```

---

## Task Distribution

### Load Balancing

```
┌─────────────────────────────────────────────────────────────────┐
│                    Task Distribution                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Task 1      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker 1    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Task 2      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker 2    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Task 3      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker 1    │  Round-robin distribution                     │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tags

- `piscina` - Worker thread pool
- `worker-threads` - Worker thread implementation
- `llm` - LLM inference
- `rag` - Document processing

---

## Related Documentation

- [LLM Integration](../features/llm-integration.md) - Llama.cpp integration
- [RAG System](../features/rag-system.md) - Document processing
- [Authentication](../features/authentication.md) - Password hashing
- [System Architecture](./system-architecture.md) - Overall architecture
