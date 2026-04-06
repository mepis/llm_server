# LLM Integration

This document covers the LLM integration with Llama.cpp, including chat completions, embeddings generation, model management, and worker thread implementation.

---

## Overview

The LLM integration provides seamless communication with Llama.cpp inference server, supporting:

- Chat completions with streaming
- Embedding generation for RAG
- Model management and health checks
- Worker thread-based inference
- Configurable inference parameters

### Llama.cpp Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     LLM Integration Architecture                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Express     │                                               │
│  │  Server      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  ChatService│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  WorkerPool │                                               │
│  │  (Piscina)   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  Server      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Model Management

### List Available Models

```
GET /api/llama/models
```

### Response (Success)

```json
{
  "success": true,
  "data": [
    {
      "id": "llama-3-8b",
      "name": "llama-3-8b-instruct",
      "size": 4978592000,
      "format": "gguf",
      "quantization": "q4_0",
      "parameters": 8
    }
  ]
}
```

### Model Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Model Schema                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  id          │  Unique identifier                           │
│  │  name        │  Full model name                             │
│  │  size        │  File size in bytes                          │
│  │  format      │  GGUF format                                  │
│  │  quantization│  Quantization level (q4_0, q8_0, etc)        │
│  │  parameters  │  Number of parameters (in billions)          │
│  │  loaded      │  Boolean (is model loaded)                    │
│  │  url         │  Path to model file                           │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Model Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Model Management Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  requests    │                                               │
│  │  models      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Health      │                                               │
│  │  Check       │                                               │
│  │  Llama.cpp   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Fetch       │                                               │
│  │  /v1/models │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Parse       │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  model list  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Completions

### Send Chat Completion

```
POST /api/llama/chat/completions
```

### Request Body

```json
{
  "model": "llama-3-8b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Explain RAG"
    }
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 2048,
  "top_p": 0.9
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "RAG (Retrieval-Augmented Generation)..."
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 15,
      "completion_tokens": 150,
      "total_tokens": 165
    },
    "model": "llama-3-8b"
  }
}
```

### Chat Completion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chat Completion Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  request     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  calls       │                                               │
│  │  Llama.cpp   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  /v1/chat    │                                               │
│  │  /completions│                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Parse       │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  response    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Embeddings Generation

### Generate Embeddings

```
POST /api/llama/embeddings
```

### Request Body

```json
{
  "model": "all-MiniLM-L6-v2",
  "input": [
    "What is RAG?",
    "Explain semantic search"
  ]
}
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "model": "all-MiniLM-L6-v2",
    "object": "list",
    "data": [
      {
        "object": "embedding",
        "embedding": [0.0023064255, -0.009327292, ...],
        "index": 0
      },
      {
        "object": "embedding",
        "embedding": [0.015230795, 0.0024504443, ...],
        "index": 1
      }
    ]
  }
}
```

### Embedding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Embedding Generation Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Auth        │                                               │
│  │  Middleware  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  LLM Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Worker      │                                               │
│  │  calls       │                                               │
│  │  Llama.cpp   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Llama.cpp   │                                               │
│  │  /v1/embeddings│                                             │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Normalize   │                                               │
│  │  embeddings  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  embeddings  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Health Check

### Check Llama.cpp Status

```
GET /api/llama/health
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
    "active_contexts": 1,
    "llama_version": "0.1.40"
  }
}
```

---

## Worker Thread Implementation

### Piscina Configuration

```javascript
const { Piscina } = require('piscina');

const piscina = new Piscina({
  filename: path.join(__dirname, 'worker.js'),
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

### Worker Message Format

```javascript
// LLM Inference Task
{
  type: 'llm-inference',
  data: {
    model: 'llama-3-8b',
    messages: [...],
    temperature: 0.7,
    max_tokens: 2048
  },
  requestId: 'req_123'
}

// Embedding Task
{
  type: 'generate-embeddings',
  data: {
    model: 'all-MiniLM-L6-v2',
    input: ['text1', 'text2']
  },
  requestId: 'req_124'
}

// Health Check Task
{
  type: 'health-check',
  requestId: 'req_125'
}
```

### Worker Implementation

```javascript
const { parentPort, workerData } = require('worker_threads');

async function handleLlmInference(req) {
  const llamaUrl = workerData.llamaServerUrl;
  
  const response = await fetch(`${llamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function handleEmbeddings(req) {
  const llamaUrl = workerData.llamaServerUrl;
  
  const response = await fetch(`${llamaUrl}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  
  return response.json();
}

parentPort.on('message', async ({ type, data, requestId }) => {
  try {
    let result;
    
    switch (type) {
      case 'llm-inference':
        result = await handleLlmInference(data);
        break;
      case 'generate-embeddings':
        result = await handleEmbeddings(data);
        break;
      case 'health-check':
        result = await checkLlamaHealth();
        break;
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

## Inference Parameters

### Available Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `temperature` | Number | 0.7 | Sampling temperature (0.0-2.0) |
| `max_tokens` | Number | 2048 | Maximum tokens to generate |
| `top_p` | Number | 0.9 | Nucleus sampling probability |
| `top_k` | Number | 40 | Top-k sampling |
| `frequency_penalty` | Number | 0.0 | Frequency penalty |
| `presence_penalty` | Number | 0.0 | Presence penalty |

### Parameter Effects

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parameter Effects Diagram                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Temperature:                                                    │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Low (0.1)  │  High (1.0) │  Very High (2.0)   │           │
│  │             │             │                     │           │
│  │  Deterministic │ Creative │ Random              │           │
│  │             │             │                     │           │
│  │  Repetitive │ Varied      │ Unpredictable       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Max Tokens:                                                     │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Low (512)  │  Medium (1024) │  High (4096)    │           │
│  │             │                │                  │           │
│  │  Short     │  Moderate      │  Long            │           │
│  │  responses │  responses     │  responses       │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  Top P (Nucleus):                                                │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Low (0.5)  │  High (0.9)   │  Very High (1.0) │           │
│  │             │                │                  │           │
│  │  Focused    │  Balanced     │  Broad           │           │
│  │             │               │                   │           │
│  │  Repetitive │  Creative     │  Diverse         │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### LLM Integration Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/llama/models` | List available models | Yes |
| POST | `/api/llama/chat/completions` | Chat completion | Yes |
| POST | `/api/llama/embeddings` | Generate embeddings | Yes |
| GET | `/api/llama/health` | Health check | No |

---

## Tags

- `llm` - LLM inference and embeddings
- `piscina` - Worker thread pool
- `streaming` - Real-time streaming responses
- `rag` - Retrieval-augmented generation
- `user` - Standard user capabilities

---

## Related Documentation

- [Chat Sessions](./chat-sessions.md) - Conversation management
- [RAG System](./rag-system.md) - Document retrieval
- [Worker Threads](../architecture/worker-threads.md) - Piscina implementation
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Send Chat Completion

```javascript
async function sendChatCompletion(messages, model = 'llama-3-8b') {
  const db = await getDB();
  
  // Spawn worker for inference
  const result = await piscina.run({
    type: 'llm-inference',
    data: {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048
    },
    requestId: crypto.randomUUID()
  });
  
  return result.data;
}
```

### Example 2: Generate Embeddings for RAG

```javascript
async function generateEmbeddings(texts, model = 'all-MiniLM-L6-v2') {
  const result = await piscina.run({
    type: 'generate-embeddings',
    data: {
      model,
      input: texts
    },
    requestId: crypto.randomUUID()
  });
  
  // Store embeddings in database
  for (let i = 0; i < result.data.data.length; i++) {
    const embedding = result.data.data[i].embedding;
    // Save to RAGDocument or RAGChunk collection
  }
  
  return result.data;
}
```

### Example 3: Stream Chat Response

```javascript
async function streamChatResponse(chatId, content) {
  const db = await getDB();
  
  // Save user message
  await db.collection('chatSessions').updateOne(
    { _id: chatId },
    { $push: { messages: { role: 'user', content } } }
  );
  
  // Stream response
  const reader = llamaStreamResponse(reader);
  const chunks = [];
  
  for await (const chunk of reader) {
    // Emit chunk to client
    chunks.push(chunk);
  }
  
  // Save complete response
  const response = chunks.join('');
  await db.collection('chatSessions').updateOne(
    { _id: chatId },
    { $push: { messages: { role: 'assistant', content: response } } }
  );
  
  return response;
}
```
