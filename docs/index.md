# LLM Server - Developer Documentation

tags: [index, overview]

Welcome to the LLM Server developer documentation. This comprehensive guide covers all aspects of the application, from architecture to implementation details.

---

## Quick Links

### Feature Documentation

- [Authentication & Authorization](./features/authentication.md) - User login, registration, JWT tokens, and RBAC role-based access control
- [User Management](./features/user-management.md) - CRUD operations, profile updates, role assignment, and password reset
- [Chat Sessions](./features/chat-sessions.md) - Conversation management with streaming responses and tool call support
- [LLM Integration](./features/llm-integration.md) - Llama.cpp inference, embeddings, model management, and audio generation
- [RAG System](./features/rag-system.md) - Document processing, chunking, embeddings, and semantic search
- [Prompt Management](./features/prompt-management.md) - Prompt templates with variables, settings, and tags
- [Tool Support](./features/tool-support.md) - Custom tool creation, execution, Zod parameter validation, and builtin tools
- [System Monitoring](./features/system-monitoring.md) - Logs, health checks, performance metrics, and system dashboard
- [Matrix Integration](./features/matrix-integration.md) - Matrix bot, webhook handling, room chat, and message processing
- [Audio Generation](./features/audio-generation.md) - Text-to-speech via Qwen3-TTS external service with speaker listing
- [Config Management](./features/config-management.md) - Application settings CRUD across server, database, auth, llama, tts, matrix categories
- [Role Management](./features/role-management.md) - Role CRUD with cascade deletion and builtin roles (user, admin, system)
- [Document Groups](./features/document-groups.md) - Cross-user document sharing with visibility levels and member permissions
- [Persistent Memory](./features/persistent-memory.md) - Three-layer memory system: episodic, semantic, procedural with auto-extraction
- [Citation System](./features/citation-system.md) - Source attribution from RAG searches with bracketed inline citations

### Component Documentation

- [Frontend Components](./components/frontend-components.md) - Vue 3 components: MessageBubble, ToolCallCard, ThinkingIndicator, Layout
- [Pinia Stores](./components/pinia-stores.md) - State management stores for auth, chat, logs, RAG, tools, memory, and more
- [Middleware](./components/middleware.md) - Authentication (JWT), RBAC (authorize/requireAdmin/requireSystem), rate limiting

### Architecture

- [System Architecture](./architecture/system-architecture.md) - Complete system design, component relationships, and data flow overview
- [Database Schema](./architecture/database-schema.md) - MongoDB collections, fields, indexes, and relationships for all models
- [Worker Threads](./architecture/worker-threads.md) - Piscina pool implementation for argon2 hashing and bash execution
- [Security Design](./architecture/security-design.md) - Password hashing (argon2id), JWT flow, validation design, and RBAC patterns
- [Architecture Deep Dive](./architecture/deep-dive.md) - Complete request flow walkthrough, worker architecture, database relationships, security layers, and streaming system

### API Reference

- [API Endpoints](./api/api-endpoints.md) - Complete REST API specification with all routes, methods, and authentication requirements
- [Request/Response Formats](./api/request-response-formats.md) - Standard response patterns wrapping data in `{ success: true, data: ... }`
- [Error Handling](./api/error-handling.md) - Error codes, validation errors, and error handling strategies

### Function Documentation

- [Chat Service Functions](./functions/chat-service-functions.md) - All chatService functions: createSession, runLoop, streamRunLoop, chatWithLLM, and more
- [Llama Service Functions](./functions/llama-service-functions.md) - All llamaService functions: getModels, chatWithTools, streaming, embeddings, healthCheck
- [Tool Service Functions](./functions/tool-service-functions.md) - Tool CRUD, call execution with Zod validation, builtin/custom tool registry
- [Document Parser Functions](./functions/document-parser-functions.md) - parsePDF, parseDOCX, parseXLSX, parseCSV, parseTXT, parseMD, parseJSON
- [Skill Service Functions](./functions/skill-service-functions.md) - Skill discovery from filesystem, caching, CRUD for SKILL.md-based skills
- [Document Group Functions](./functions/document-group-functions.md) - Group CRUD, member management, ownership transfer with MongoDB transactions

### Technical Reference

- [Configuration Guide](./technical/configuration-guide.md) - Environment variables (.env), setup instructions, and initialization scripts
- [Deployment Guide](./technical/deployment-guide.md) - Docker setup, production deployment, and environment configuration
- [Performance Guide](./technical/performance-guide.md) - Optimization strategies, caching, query performance, and scaling
- [Troubleshooting](./technical/troubleshooting.md) - Common issues, debugging tips, and known gotchas
- [Platform Information](./technical/platform-info.md) - Platform requirements, dependency matrix, port configuration, env variables reference, data flow diagrams

### QA & Testing

- [API Testing Examples](./qa/api-testing-examples.md) - curl examples for auth, chat, RAG, tools, user management, memory, and monitor endpoints
- [Practical Examples](./qa/practical-examples.md) - Real-world scenarios: multi-turn tool chat, RAG Q&A, SSE streaming code, custom tools, memory enhancement

---

## Table of Contents

### [Index](#table-of-contents)
See the top section for categorized quick links.

### Tags Index
- [Authentication & Security](./tags-index.md#authentication--security)
- [User Roles](./tags-index.md#user-roles)
- [Core Features](./tags-index.md#core-features)
- [Integration](./tags-index.md#integration)
- [Infrastructure](./tags-index.md#infrastructure)
- [Technical Components](./tags-index.md#technical-components)
- [Error Handling](./tags-index.md#error-handling)
- [QA & Testing](./tags-index.md#qa--testing)
- [Workflow](./tags-index.md#workflow)

### Features (15 pages)
- [Authentication & Authorization](./features/authentication.md)
- [User Management](./features/user-management.md)
- [Chat Sessions](./features/chat-sessions.md)
- [LLM Integration](./features/llm-integration.md)
- [RAG System](./features/rag-system.md)
- [Prompt Management](./features/prompt-management.md)
- [Tool Support](./features/tool-support.md)
- [System Monitoring](./features/system-monitoring.md)
- [Matrix Integration](./features/matrix-integration.md)
- [Audio Generation](./features/audio-generation.md)
- [Config Management](./features/config-management.md)
- [Role Management](./features/role-management.md)
- [Document Groups](./features/document-groups.md)
- [Persistent Memory](./features/persistent-memory.md)
- [Citation System](./features/citation-system.md)

### Components (3 pages)
- [Frontend Components](./components/frontend-components.md)
- [Pinia Stores](./components/pinia-stores.md)
- [Middleware](./components/middleware.md)

### Architecture (5 pages)
- [System Architecture](./architecture/system-architecture.md)
- [Database Schema](./architecture/database-schema.md)
- [Worker Threads](./architecture/worker-threads.md)
- [Security Design](./architecture/security-design.md)
- [Architecture Deep Dive](./architecture/deep-dive.md)

### API (3 pages)
- [API Endpoints](./api/api-endpoints.md)
- [Request/Response Formats](./api/request-response-formats.md)
- [Error Handling](./api/error-handling.md)

### Functions (6 pages)
- [Chat Service Functions](./functions/chat-service-functions.md)
- [Llama Service Functions](./functions/llama-service-functions.md)
- [Tool Service Functions](./functions/tool-service-functions.md)
- [Document Parser Functions](./functions/document-parser-functions.md)
- [Skill Service Functions](./functions/skill-service-functions.md)
- [Document Group Functions](./functions/document-group-functions.md)

### Technical (5 pages)
- [Configuration Guide](./technical/configuration-guide.md)
- [Deployment Guide](./technical/deployment-guide.md)
- [Performance Guide](./technical/performance-guide.md)
- [Troubleshooting](./technical/troubleshooting.md)
- [Platform Information](./technical/platform-info.md)

### QA (2 pages)
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
│  ┌───────────┐  │ │ ┌───────────┐  │ │ ┌────────────┐ │ │
│  │ User      │  │ │ │ Argon2     │  │ │ │ MongoDB    │ │ │
│  │ Service   │──┼──│ │ Worker    │  │ │ │ Collection │ │ │
│  └───────────┘  │ │ └───────────┘  │ │ └────────────┘ │ │
│  ┌───────────┐  │ │ │ Llama      │  │ │                │ │
│  │ Chat      │  │ │ │ Inference  │  │ │ Llama.cpp     │ │
│  │ Service   │──┼──│ │ Worker    │  │ │ Server        │ │
│  └───────────┘  │ │ └───────────┘  │ │ (Port 8082)   │ │
│  ┌───────────┐  │ │ ┌───────────┐  │ │               │ │
│  │ RAG       │  │ │ │ Llama     │  │ │ TTS Server    │ │
│  │ Service   │──┼──│ │ Embeddings│  │ │ (Qwen3-TTS)  │ │
│  └───────────┘  │ │   Worker    │  │ │               │ │
│  ┌───────────┐  │ │             │  │ └──────────────┘ │
│  │ Prompt    │  │ └─────────────┘                      │
│  │ Service   │  │                                      │
│  ┌───────────┐  │      Piscina (2-4 threads)           │
│  │ Tool      │  │                                      │
│  │ Service   │  │                                      │
│  └───────────┘  │                                      │
│  ┌───────────┐  │                                      │
│  │ Matrix    │  │                                      │
│  │ Service   │  │                                      │
│  └───────────┘  │                                      │
│  ┌───────────┐  │                                      │
│  │ Log       │  │                                      │
│  │ Service   │  │                                      │
│  └───────────┘  │                                      │
│  ┌───────────┐  │                                      │
│  │ Memory    │  │                                      │
│  │ Manager   │  │                                      │
│  └───────────┘  │                                      │
│  ┌───────────┐  │                                      │
│  │ Document  │  │                                      │
│  │ Parser    │  │                                      │
│  └───────────┘  │                                      │
└─────────────────┘  └───────────────┘ └─────────────────┘
```

---

## Documentation Structure

```
docs/
├── features/           # Feature documentation (15 pages)
│   ├── authentication.md
│   ├── user-management.md
│   ├── chat-sessions.md
│   ├── llm-integration.md
│   ├── rag-system.md
│   ├── prompt-management.md
│   ├── tool-support.md
│   ├── system-monitoring.md
│   ├── matrix-integration.md
│   ├── audio-generation.md
│   ├── config-management.md
│   ├── role-management.md
│   ├── document-groups.md
│   ├── persistent-memory.md
│   └── citation-system.md
├── components/         # Component documentation (3 pages)
│   ├── frontend-components.md
│   ├── pinia-stores.md
│   └── middleware.md
├── architecture/       # Architecture documentation (5 pages)
│   ├── system-architecture.md
│   ├── database-schema.md
│   ├── worker-threads.md
│   ├── security-design.md
│   └── deep-dive.md
├── api/               # API documentation (3 pages)
│   ├── api-endpoints.md
│   ├── request-response-formats.md
│   └── error-handling.md
├── functions/         # Function-level documentation (6 pages)
│   ├── chat-service-functions.md
│   ├── llama-service-functions.md
│   ├── tool-service-functions.md
│   ├── document-parser-functions.md
│   ├── skill-service-functions.md
│   └── document-group-functions.md
├── technical/         # Technical documentation (5 pages)
│   ├── configuration-guide.md
│   ├── deployment-guide.md
│   ├── performance-guide.md
│   ├── troubleshooting.md
│   └── platform-info.md
├── qa/               # QA and examples (2 pages)
│   ├── api-testing-examples.md
│   └── practical-examples.md
├── llama.cpp_docs/   # Llama.cpp reference documentation
├── index.md          # This file
├── tags-index.md     # Tag-based navigation
└── CHANGELOG.md      # Release changelog
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
- `audio` - Text-to-speech audio generation
- `config` - Application configuration management
- `roles` - Role-based access control management
- `document-groups` - Cross-user document sharing
- `memory` - Persistent cross-session memory
- `citations` - Source attribution in responses

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
- `zod` - Schema validation
- `sse` - Server-sent events streaming

---

## Quick Start

### Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Create admin user
npm run seed-admin    # creates admin/admin123 (password: admin123)

# Initialize configuration defaults
npm run seed-config

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
FRONTEND_URL=http://localhost:5173
```

See [Configuration Guide](./technical/configuration-guide.md) for all available environment variables and [Platform Information](./technical/platform-info.md) for the complete reference.

---

## Related Documentation

- [Llama.cpp Documentation](./llama.cpp_docs/) - Llama.cpp server documentation
- [AGENTS.md](../AGENTS.md) - Agent-specific instructions with architecture overview
