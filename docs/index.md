# LLM Server - Developer Documentation

Welcome to the LLM Server developer documentation. This comprehensive guide covers all aspects of the application, from architecture to implementation details.

---

## Quick Links

### Feature Documentation
- [Authentication & Authorization](./features/authentication.md) - User login, registration, JWT tokens, and RBAC
- [User Management](./features/user-management.md) - CRUD operations, profile updates, role assignment
- [Chat Sessions](./features/chat-sessions.md) - Conversation management with streaming responses
- [LLM Integration](./features/llm-integration.md) - Llama.cpp inference, embeddings, model management
- [RAG System](./features/rag-system.md) - Document processing, embeddings, semantic search
- [Prompt Management](./features/prompt-management.md) - Prompt templates with variables and tags
- [Tool Support](./features/tool-support.md) - Custom tool creation, execution, and parameters
- [System Monitoring](./features/system-monitoring.md) - Logs, health checks, performance metrics
- [Matrix Integration](./features/matrix-integration.md) - Matrix bot, webhook handling, room chat

### Component Documentation
- [Frontend Components](./components/frontend-components.md) - Vue 3 components and layouts
- [Pinia Stores](./components/pinia-stores.md) - State management stores
- [Middleware](./components/middleware.md) - Authentication, RBAC, rate limiting

### Architecture
- [System Architecture](./architecture/system-architecture.md) - Complete system design and data flow
- [Database Schema](./architecture/database-schema.md) - MongoDB collections and indexes
- [Worker Threads](./architecture/worker-threads.md) - Piscina pool and task distribution
- [Security Design](./architecture/security-design.md) - Password hashing, JWT, validation

### API Reference
- [API Endpoints](./api/api-endpoints.md) - Complete REST API specification
- [Request/Response Formats](./api/request-response-formats.md) - Standard response patterns
- [Error Handling](./api/error-handling.md) - Error codes and handling strategies

### Technical Reference
- [Configuration Guide](./technical/configuration-guide.md) - Environment variables and setup
- [Deployment Guide](./technical/deployment-guide.md) - Docker, production setup
- [Performance Guide](./technical/performance-guide.md) - Optimization strategies
- [Troubleshooting](./technical/troubleshooting.md) - Common issues and solutions

### QA
- [API Testing Examples](./qa/api-testing-examples.md) - API test cases and examples
- [Practical Examples](./qa/practical-examples.md) - Real-world usage examples

---

## Table of Contents

### [Index](#table-of-contents)
- [Features](#features)
- [Components](#components)
- [Architecture](#architecture)
- [API](#api)
- [Technical](#technical)
- [QA](#qa)

### Tags Index
- [Authentication & Security](./tags-index.md#authentication--security)
- [User Roles](./tags-index.md#user-roles)
- [Core Features](./tags-index.md#core-features)
- [Integration](./tags-index.md#integration)
- [Infrastructure](./tags-index.md#infrastructure)
- [Technical Components](./tags-index.md#technical-components)

### Features
- [Authentication & Authorization](./features/authentication.md)
- [User Management](./features/user-management.md)
- [Chat Sessions](./features/chat-sessions.md)
- [LLM Integration](./features/llm-integration.md)
- [RAG System](./features/rag-system.md)
- [Prompt Management](./features/prompt-management.md)
- [Tool Support](./features/tool-support.md)
- [System Monitoring](./features/system-monitoring.md)
- [Matrix Integration](./features/matrix-integration.md)

### Components
- [Frontend Components](./components/frontend-components.md)
- [Pinia Stores](./components/pinia-stores.md)
- [Middleware](./components/middleware.md)

### Architecture
- [System Architecture](./architecture/system-architecture.md)
- [Database Schema](./architecture/database-schema.md)
- [Worker Threads](./architecture/worker-threads.md)
- [Security Design](./architecture/security-design.md)

### API
- [API Endpoints](./api/api-endpoints.md)
- [Request/Response Formats](./api/request-response-formats.md)
- [Error Handling](./api/error-handling.md)

### Technical
- [Configuration Guide](./technical/configuration-guide.md)
- [Deployment Guide](./technical/deployment-guide.md)
- [Performance Guide](./technical/performance-guide.md)
- [Troubleshooting](./technical/troubleshooting.md)

### QA
- [API Testing Examples](./qa/api-testing-examples.md)
- [Practical Examples](./qa/practical-examples.md)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Web App    │    │  Matrix Bot  │    │ External API │      │
│  │  (Vue 3)     │    │(matrix-js-sdk)│    │   Clients   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Express.js Server (Port 3000)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ Auth        │  │  RBAC       │  │ Rate Limiter│     │   │
│  │  │ Middleware  │  │ Middleware  │  │             │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Business Logic │ │   Worker Pool   │ │   Data Layer    │
│  ┌───────────┐  │ │ ┌───────────┐  │ │ ┌────────────┐ │
│  │ User      │  │ │ │ Argon2     │  │ │ │ MongoDB    │ │
│  │ Service   │──┼──│ │ Worker    │  │ │ │ Collection │ │
│  └───────────┘  │ │ └───────────┘  │ │ └────────────┘ │
│  ┌───────────┐  │ │ │ Llama      │  │ │                │
│  │ Chat      │  │ │ │ Inference  │  │ │ Llama.cpp     │
│  │ Service   │──┼──│ │ Worker    │  │ │ Server        │
│  └───────────┘  │ │ └───────────┘  │ │ (Port 8082)   │
│  ┌───────────┐  │ │ ┌───────────┐  │ │               │
│  │ RAG       │  │ │ │ Llama     │  │ │               │
│  │ Service   │──┼──│ │ Embeddings│  │ │               │
│  └───────────┘  │ │   Worker    │  │ │               │
│  ┌───────────┐  │ │             │  │ │               │
│  │ Prompt    │  │ └─────────────┘  │ └──────────────┘ │
│  │ Service   │  │                  │                  │
│  ┌───────────┐  │                  │                  │
│  │ Tool      │  │                  │                  │
│  │ Service   │  │                  │                  │
│  └───────────┘  │                  │                  │
│  ┌───────────┐  │                  │                  │
│  │ Matrix    │  │                  │                  │
│  │ Service   │  │                  │                  │
│  └───────────┘  │                  │                  │
│  ┌───────────┐  │                  │                  │
│  │ Log       │  │                  │                  │
│  │ Service   │  │                  │                  │
│  └───────────┘  │                  │                  │
└─────────────────┘  └───────────────┘ └─────────────────┘
```

---

## Tags

### Feature Tags
- `auth` - Authentication and authorization
- `user-management` - User CRUD operations
- `chat` - Chat session management
- `llm` - LLM inference and embeddings
- `rag` - Retrieval-augmented generation
- `prompts` - Prompt template management
- `tools` - Custom tool execution
- `monitoring` - System monitoring and logging
- `matrix` - Matrix integration

### User Role Tags
- `user` - Standard user capabilities
- `admin` - Administrative privileges
- `system` - System-level operations

### Technical Tags
- `nodejs` - Node.js runtime
- `express` - Express.js framework
- `mongodb` - MongoDB database
- `vue3` - Vue 3 frontend
- `piscina` - Worker thread pool
- `argon2` - Password hashing
- `jwt` - JWT authentication
- `matrix` - Matrix protocol

---

## Quick Start

### Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Create admin user
npm run seed-admin

# Start servers
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/llm_server
LLAMA_SERVER_URL=http://localhost:8082
JWT_SECRET=your-secret-key
```

See [Configuration Guide](./technical/configuration-guide.md) for all available environment variables.

---

## Documentation Structure

```
docs/
├── features/          # Feature documentation pages
│   ├── authentication.md
│   ├── user-management.md
│   ├── chat-sessions.md
│   ├── llm-integration.md
│   ├── rag-system.md
│   ├── prompt-management.md
│   ├── tool-support.md
│   ├── system-monitoring.md
│   └── matrix-integration.md
├── components/        # Component documentation
│   ├── frontend-components.md
│   ├── pinia-stores.md
│   └── middleware.md
├── architecture/      # Architecture documentation
│   ├── system-architecture.md
│   ├── database-schema.md
│   ├── worker-threads.md
│   └── security-design.md
├── api/              # API documentation
│   ├── api-endpoints.md
│   ├── request-response-formats.md
│   └── error-handling.md
├── technical/        # Technical documentation
│   ├── configuration-guide.md
│   ├── deployment-guide.md
│   ├── performance-guide.md
│   └── troubleshooting.md
├── qa/               # QA and examples
│   ├── api-testing-examples.md
│   └── practical-examples.md
└── index.md          # This file
```

---

## Related Documentation

- [Llama.cpp Documentation](../llama.cpp_docs/) - Llama.cpp server documentation
- [API Design Document](../design_documents/design.md) - Original API specification
- [Todo List](../design_documents/todo.md) - Implementation roadmap
