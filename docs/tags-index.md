# LLM Server - Documentation Index by Tags

tags: [index, tags, navigation]

This index organizes all documentation pages by tags, making it easy to find relevant information based on features, roles, and technical components.

---

## Tag Categories

### Authentication & Security

Tag documents related to authentication, authorization, and security features.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `auth` | Authentication and authorization | [Authentication](./features/authentication.md), [User Management](./features/user-management.md), [Middleware](./components/middleware.md), [Security Design](./architecture/security-design.md) |
| `user-management` | User CRUD operations | [User Management](./features/user-management.md), [API Endpoints](./api/api-endpoints.md) |
| `jwt` | JWT authentication | [Authentication](./features/authentication.md), [Security Design](./architecture/security-design.md) |
| `argon2` | Password hashing (argon2id via node-argon2 v1.0.0) | [Authentication](./features/authentication.md), [Security Design](./architecture/security-design.md) |
| `security` | Security best practices | [Security Design](./architecture/security-design.md), [Configuration](./technical/configuration-guide.md) |
| `rbac` | Role-based access control | [Middleware](./components/middleware.md), [Authentication](./features/authentication.md), [Role Management](./features/role-management.md) |
| `rate-limiting` | Request rate limiting (API 100/15min, Auth 5/15min, Registration 3/day) | [Middleware](./components/middleware.md), [Configuration](./technical/configuration-guide.md) |

### User Roles

Tag documents organized by user role capabilities.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `user` | Standard user capabilities | [Chat Sessions](./features/chat-sessions.md), [RAG System](./features/rag-system.md), [Prompt Management](./features/prompt-management.md) |
| `admin` | Administrative privileges | [User Management](./features/user-management.md), [System Monitoring](./features/system-monitoring.md), [API Endpoints](./api/api-endpoints.md), [Role Management](./features/role-management.md) |
| `system` | System-level operations | [System Monitoring](./features/system-monitoring.md), [Matrix Integration](./features/matrix-integration.md) |

### Core Features

Tag documents for core application features.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `chat` | Chat session management with streaming and tool calls | [Chat Sessions](./features/chat-sessions.md), [LLM Integration](./features/llm-integration.md), [API Endpoints](./api/api-endpoints.md) |
| `llm` | LLM inference and embeddings via Llama.cpp | [LLM Integration](./features/llm-integration.md), [RAG System](./features/rag-system.md), [Worker Threads](./architecture/worker-threads.md) |
| `rag` | Retrieval-augmented generation with document processing | [RAG System](./features/rag-system.md), [LLM Integration](./features/llm-integration.md), [Architecture Deep Dive](./architecture/deep-dive.md) |
| `prompts` | Prompt template management with variables and tags | [Prompt Management](./features/prompt-management.md), [API Endpoints](./api/api-endpoints.md) |
| `tools` | Custom tool execution with Zod validation | [Tool Support](./features/tool-support.md), [API Endpoints](./api/api-endpoints.md) |
| `streaming` | SSE response streaming flow | [Chat Sessions](./features/chat-sessions.md), [API Endpoints](./api/api-endpoints.md), [Architecture Deep Dive](./architecture/deep-dive.md) |
| `pagination` | Data pagination patterns | [User Management](./features/user-management.md), [API Endpoints](./api/api-endpoints.md) |
| `document-groups` | Cross-user document sharing with permissions | [Document Groups](./features/document-groups.md), [RAG System](./features/rag-system.md), [Chat Sessions](./features/chat-sessions.md) |
| `memory` | Per-user cross-session three-layer memory system | [Persistent Memory](./features/persistent-memory.md), [Chat Sessions](./features/chat-sessions.md), [RAG System](./features/rag-system.md) |
| `citations` | Source attribution from RAG searches | [Citation System](./features/citation-system.md), [RAG System](./features/rag-system.md) |
| `audio` | Text-to-speech audio generation via Qwen3-TTS | [Audio Generation](./features/audio-generation.md), [LLM Integration](./features/llm-integration.md) |
| `config` | Application configuration management | [Config Management](./features/config-management.md), [Configuration Guide](./technical/configuration-guide.md) |
| `roles` | Role CRUD with cascade deletion | [Role Management](./features/role-management.md), [User Management](./features/user-management.md) |

### Integration

Tag documents for third-party integrations.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `matrix` | Matrix bot integration with webhook handling | [Matrix Integration](./features/matrix-integration.md), [System Monitoring](./features/system-monitoring.md) |
| `webhooks` | Webhook configuration for Matrix events | [Matrix Integration](./features/matrix-integration.md) |
| `mongodb` | MongoDB database with Mongoose ODM | [Database Schema](./architecture/database-schema.md), [Worker Threads](./architecture/worker-threads.md) |
| `express` | Express.js framework and routing | [API Endpoints](./api/api-endpoints.md), [Middleware](./components/middleware.md) |
| `vue3` | Vue 3 frontend with Composition API | [Frontend Components](./components/frontend-components.md), [Pinia Stores](./components/pinia-stores.md) |

### Infrastructure

Tag documents for infrastructure and technical implementation.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `piscina` | Worker thread pool (2-4 threads, 30s idle timeout) | [Worker Threads](./architecture/worker-threads.md), [LLM Integration](./features/llm-integration.md) |
| `monitoring` | System monitoring and observability | [System Monitoring](./features/system-monitoring.md), [Technical](./technical/performance-guide.md) |
| `logging` | Application logging with Winston | [System Monitoring](./features/system-monitoring.md), [Technical](./technical/troubleshooting.md) |
| `deployment` | Deployment guide and production setup | [Deployment Guide](./technical/deployment-guide.md), [Configuration](./technical/configuration-guide.md) |
| `docker` | Docker configuration for containerized deployment | [Deployment Guide](./technical/deployment-guide.md) |
| `production` | Production deployment best practices | [Deployment Guide](./technical/deployment-guide.md), [Platform Information](./technical/platform-info.md) |

### Technical Components

Tag documents for technical implementation details.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `nodejs` | Node.js runtime (>= 24.12.0 required) | [Configuration](./technical/configuration-guide.md), [Deployment](./technical/deployment-guide.md), [Platform Info](./technical/platform-info.md) |
| `middleware` | Express middleware stack | [Middleware](./components/middleware.md), [API Endpoints](./api/api-endpoints.md) |
| `state-management` | Pinia state management for frontend | [Pinia Stores](./components/pinia-stores.md), [Frontend Components](./components/frontend-components.md) |
| `worker-threads` | Worker thread implementation via Piscina | [Worker Threads](./architecture/worker-threads.md), [Llama Integration](./features/llm-integration.md) |
| `caching` | Response caching strategies (models 60s, skills 30s) | [Performance Guide](./technical/performance-guide.md), [Configuration](./technical/configuration-guide.md) |
| `performance` | Performance optimization and scaling | [Performance Guide](./technical/performance-guide.md), [Troubleshooting](./technical/troubleshooting.md) |
| `optimization` | Query and system optimization strategies | [Performance Guide](./technical/performance-guide.md), [Platform Info](./technical/platform-info.md) |
| `zod` | Schema validation for tool parameters | [Tool Support](./features/tool-support.md), [Tool Service Functions](./functions/tool-service-functions.md) |
| `sse` | Server-sent events for streaming responses | [Architecture Deep Dive](./architecture/deep-dive.md), [Chat Service Functions](./functions/chat-service-functions.md) |

### Error Handling

Tag documents for error handling and debugging.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `error-handling` | Error handling patterns and codes | [Error Handling](./api/error-handling.md), [API Endpoints](./api/api-endpoints.md) |
| `troubleshooting` | Troubleshooting guide for common issues | [Troubleshooting](./technical/troubleshooting.md) |
| `debugging` | Debug tips and diagnostic approaches | [Troubleshooting](./technical/troubleshooting.md), [Architecture Deep Dive](./architecture/deep-dive.md) |

### QA & Testing

Tag documents for quality assurance and testing.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `qa` | QA testing documentation | [API Testing](./qa/api-testing-examples.md), [Practical Examples](./qa/practical-examples.md) |
| `examples` | Practical usage examples | [API Testing](./qa/api-testing-examples.md), [Practical Examples](./qa/practical-examples.md) |
| `api-testing` | API test cases with curl examples | [API Testing](./qa/api-testing-examples.md) |

### Workflow

Tag documents for common workflows and patterns.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `workflows` | Multi-step business workflows | [Practical Examples](./qa/practical-examples.md), [Chat Sessions](./features/chat-sessions.md) |
| `multi-turn-chat` | Conversation state management with tool loops | [Chat Sessions](./features/chat-sessions.md), [Practical Examples](./qa/practical-examples.md), [Chat Service Functions](./functions/chat-service-functions.md) |
| `complete-pipeline` | End-to-end request/response flow | [Practical Examples](./qa/practical-examples.md), [Architecture Deep Dive](./architecture/deep-dive.md) |
| `retry-patterns` | Retry logic and backoff strategies | [Practical Examples](./qa/practical-examples.md) |
| `batch-operations` | Bulk data processing patterns | [User Management](./features/user-management.md), [Pinia Stores](./components/pinia-stores.md) |
| `query-optimization` | Database query optimization and indexing | [User Management](./features/user-management.md), [Performance Guide](./technical/performance-guide.md) |

---

## Tag Cross-Reference

### Feature-Based Tags

These tags group documentation by application features:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Feature Tags Overview                                │
├─────────────────────┬──────────────────────┬───────────────────────────┤
│ Authentication      │ User Management       │ Chat Sessions             │
│  auth               │  user-management      │  chat                     │
│  jwt                │  admin                │  llm                      │
│  argon2             │  system               │  rag                      │
│  rbac               │  profiles             │  prompts                  │
│  rate-limiting      │  roles                │  tools                    │
│                     │                       │  streaming                │
├─────────────────────┼──────────────────────┼───────────────────────────┤
│ LLM Integration     │ RAG System           │ Document Groups           │
│  llm                │  rag                  │  document-groups          │
│  piscina            │  mongodb              │  memory                   │
│  streaming          │  embeddings           │  citations                │
│  audio              │                       │                           │
├─────────────────────┼──────────────────────┼───────────────────────────┤
│ Matrix Bot          │ Prompt Management    │ Tool Support              │
│  matrix             │  prompts              │  tools                    │
│  webhooks           │  workflows            │  user-management          │
│  system             │  pagination           │  security                 │
│                     │                       │  zod                      │
├─────────────────────┼──────────────────────┼───────────────────────────┤
│ Audio Generation    │ Config Management    │ Role Management           │
│  audio              │  config               │  roles                    │
│                       │ server/database/auth  │ rbac                     │
│                       │ llama/tts/matrix      │ cascade-deletion         │
├─────────────────────┼──────────────────────┼───────────────────────────┤
│ Persistent Memory   │ Citation System      │ Monitoring                │
│  memory             │  citations            │  monitoring               │
│  episodic           │  rag                  │  logging                  │
│  semantic           │                       │  admin                    │
│  procedural         │                       │                           │
└─────────────────────┴──────────────────────┴───────────────────────────┘
```

### Role-Based Tags

These tags organize documentation by user role:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Role-Based Documentation                             │
├─────────────────────┬──────────────────────┬───────────────────────────┤
│                     │ Admin                │ System                    │
│                     ├──────────────────────┼───────────────────────────┤
│                     │ User Mgmt            │ System Monitoring         │
│ User                │ API Endpoints        │ Logs                      │
│                     │ Role Management      │ Matrix Integration        │
│  Chat               │ Config Management    │ Health Checks             │
│  RAG                │ RBAC                 │ Performance Metrics       │
│  Prompts            │ Security             │                           │
│  Tools              │ Rate Limiting        │                           │
│  Document Groups    │ Profiles             │                           │
└─────────────────────┴──────────────────────┴───────────────────────────┘
```

---

## Quick Navigation by Tag

### For Developers Working on Authentication
Start with:
1. [Authentication](./features/authentication.md) - Core auth flow
2. [Security Design](./architecture/security-design.md) - Security patterns
3. [Middleware](./components/middleware.md) - Auth middleware
4. [API Endpoints](./api/api-endpoints.md) - Auth endpoints

### For Developers Working on Chat Features
Start with:
1. [Chat Sessions](./features/chat-sessions.md) - Session management
2. [LLM Integration](./features/llm-integration.md) - Llama.cpp integration
3. [RAG System](./features/rag-system.md) - Context retrieval
4. [Chat Service Functions](./functions/chat-service-functions.md) - Function details

### For Developers Working on RAG
Start with:
1. [RAG System](./features/rag-system.md) - Document processing
2. [LLM Integration](./features/llm-integration.md) - Embeddings
3. [Database Schema](./architecture/database-schema.md) - Document model
4. [Citation System](./features/citation-system.md) - Source attribution

### For Developers Working on Memory System
Start with:
1. [Persistent Memory](./features/persistent-memory.md) - Three-layer memory
2. [Chat Sessions](./features/chat-sessions.md) - Memory injection in chat
3. [Memory Manager Functions](./functions/persistent-memory.md#memory-manager-functions) - Function details

### For Developers Working on Document Groups
Start with:
1. [Document Groups](./features/document-groups.md) - Group CRUD and permissions
2. [RAG System](./features/rag-system.md) - Shared document access
3. [Document Group Functions](./functions/document-group-functions.md) - Function details

### For Frontend Developers
Start with:
1. [Frontend Components](./components/frontend-components.md) - Vue components
2. [Pinia Stores](./components/pinia-stores.md) - State management
3. [API Endpoints](./api/api-endpoints.md) - API integration
4. [Configuration Guide](./technical/configuration-guide.md) - Environment setup

### For DevOps/Deployment
Start with:
1. [Deployment Guide](./technical/deployment-guide.md) - Production setup
2. [Configuration Guide](./technical/configuration-guide.md) - Environment variables
3. [Platform Information](./technical/platform-info.md) - Requirements and dependencies
4. [System Monitoring](./features/system-monitoring.md) - Observability

### For QA/Testing
Start with:
1. [API Testing Examples](./qa/api-testing-examples.md) - Test cases
2. [Practical Examples](./qa/practical-examples.md) - Usage patterns
3. [API Endpoints](./api/api-endpoints.md) - API reference
4. [Error Handling](./api/error-handling.md) - Error codes

### For Debugging/Troubleshooting
Start with:
1. [Troubleshooting](./technical/troubleshooting.md) - Common issues
2. [Configuration Guide](./technical/configuration-guide.md) - Environment variables
3. [Error Handling](./api/error-handling.md) - Error codes
4. [Architecture Deep Dive](./architecture/deep-dive.md) - Request flow walkthrough

---

## Tag Summary Table

| Tag | Category | Primary Page | Secondary Pages |
|-----|----------|--------------|-----------------|
| `auth` | Feature | Authentication | User Management, Middleware, Security Design |
| `chat` | Feature | Chat Sessions | LLM Integration, RAG System, API Endpoints |
| `llm` | Feature | LLM Integration | RAG System, Worker Threads, Architecture Deep Dive |
| `rag` | Feature | RAG System | LLM Integration, Database Schema, Citation System |
| `document-groups` | Feature | Document Groups | RAG System, Chat Sessions, Document Group Functions |
| `memory` | Feature | Persistent Memory | Chat Sessions, RAG System, Architecture Deep Dive |
| `citations` | Feature | Citation System | RAG System, Chat Service Functions |
| `audio` | Feature | Audio Generation | LLM Integration, Platform Information |
| `config` | Feature | Config Management | Configuration Guide, Platform Information |
| `roles` | Feature | Role Management | User Management, Middleware, RBAC |
| `prompts` | Feature | Prompt Management | API Endpoints |
| `tools` | Feature | Tool Support | API Endpoints, Tool Service Functions |
| `streaming` | Feature | Chat Sessions | Architecture Deep Dive, Chat Service Functions |
| `matrix` | Integration | Matrix Integration | System Monitoring |
| `mongodb` | Technical | Database Schema | Worker Threads, Platform Information |
| `piscina` | Technical | Worker Threads | LLM Integration, Architecture Deep Dive |
| `vue3` | Technical | Frontend Components | Pinia Stores, Platform Information |
| `nodejs` | Technical | Configuration Guide | Deployment Guide, Platform Information |
| `argon2` | Security | Security Design | Authentication, Platform Information |
| `jwt` | Security | Security Design | Authentication, Middleware |
| `rbac` | Security | Middleware | Authentication, Role Management |
| `rate-limiting` | Security | Middleware | Configuration Guide, Platform Information |
| `user` | Role | Chat Sessions | RAG System, Tools |
| `admin` | Role | User Management | System Monitoring, Role Management |
| `system` | Role | System Monitoring | Matrix Integration |
| `monitoring` | Infrastructure | System Monitoring | Performance Guide |
| `logging` | Infrastructure | System Monitoring | Troubleshooting |
| `deployment` | Infrastructure | Deployment Guide | Configuration Guide |
| `docker` | Infrastructure | Deployment Guide | Configuration Guide |
| `express` | Technical | API Endpoints | Middleware |
| `state-management` | Technical | Pinia Stores | Frontend Components |
| `worker-threads` | Technical | Worker Threads | LLM Integration |
| `caching` | Technical | Performance Guide | Configuration Guide |
| `performance` | Technical | Performance Guide | Troubleshooting |
| `zod` | Technical | Tool Support | Tool Service Functions |
| `sse` | Technical | Architecture Deep Dive | Chat Service Functions |
| `streaming` | Feature | Chat Sessions | API Endpoints, Architecture Deep Dive |
| `pagination` | Feature | User Management | API Endpoints |
| `error-handling` | Error | Error Handling | API Endpoints |
| `troubleshooting` | Error | Troubleshooting | Configuration Guide |
| `debugging` | Error | Troubleshooting | Architecture Deep Dive |
| `qa` | QA | API Testing | Practical Examples |
| `examples` | QA | API Testing | Practical Examples |
| `api-testing` | QA | API Testing | Practical Examples |
| `workflows` | Workflow | Practical Examples | Chat Sessions |
| `multi-turn-chat` | Workflow | Chat Sessions | Practical Examples, Chat Service Functions |
| `complete-pipeline` | Workflow | Practical Examples | Architecture Deep Dive |
| `retry-patterns` | Workflow | Practical Examples | Chat Sessions |
| `batch-operations` | Workflow | User Management | Pinia Stores |
| `query-optimization` | Workflow | User Management | Performance Guide |
| `webhooks` | Integration | Matrix Integration | System Monitoring |

---

## Related Documentation Links

- [Main Documentation Index](./index.md) - Complete documentation overview
- [API Endpoints](./api/api-endpoints.md) - Full REST API reference
- [Database Schema](./architecture/database-schema.md) - MongoDB collection definitions
- [Deployment Guide](./technical/deployment-guide.md) - Production deployment instructions
- [Architecture Deep Dive](./architecture/deep-dive.md) - Complete system walkthrough

---

## Documentation Links

- [Authentication](./features/authentication.md) - Auth implementation
- [User Management](./features/user-management.md) - User CRUD operations
- [Chat Sessions](./features/chat-sessions.md) - Session management
- [LLM Integration](./features/llm-integration.md) - Llama.cpp integration
- [RAG System](./features/rag-system.md) - Document retrieval
- [Document Groups](./features/document-groups.md) - Cross-user document sharing
- [Persistent Memory](./features/persistent-memory.md) - Per-user cross-session memory
- [Citation System](./features/citation-system.md) - Source attribution in chat
- [Prompt Management](./features/prompt-management.md) - Prompt templates
- [Tool Support](./features/tool-support.md) - Custom tools
- [System Monitoring](./features/system-monitoring.md) - Monitoring capabilities
- [Matrix Integration](./features/matrix-integration.md) - Matrix bot
- [Audio Generation](./features/audio-generation.md) - Text-to-speech audio
- [Config Management](./features/config-management.md) - Application settings
- [Role Management](./features/role-management.md) - Role CRUD management
- [Security Design](./architecture/security-design.md) - Security architecture
- [Database Schema](./architecture/database-schema.md) - MongoDB collections
- [Worker Threads](./architecture/worker-threads.md) - Piscina pool
- [System Architecture](./architecture/system-architecture.md) - Overall design
- [Architecture Deep Dive](./architecture/deep-dive.md) - Complete walkthrough
- [API Endpoints](./api/api-endpoints.md) - Complete API reference
- [Request/Response Formats](./api/request-response-formats.md) - Response patterns
- [Error Handling](./api/error-handling.md) - Error codes
- [Frontend Components](./components/frontend-components.md) - Vue components
- [Pinia Stores](./components/pinia-stores.md) - State management
- [Middleware](./components/middleware.md) - Security middleware
- [Chat Service Functions](./functions/chat-service-functions.md) - Chat function details
- [Llama Service Functions](./functions/llama-service-functions.md) - Llama function details
- [Tool Service Functions](./functions/tool-service-functions.md) - Tool function details
- [Document Parser Functions](./functions/document-parser-functions.md) - Parser function details
- [Skill Service Functions](./functions/skill-service-functions.md) - Skill function details
- [Document Group Functions](./functions/document-group-functions.md) - Group function details
- [Configuration Guide](./technical/configuration-guide.md) - Environment variables
- [Deployment Guide](./technical/deployment-guide.md) - Production setup
- [Performance Guide](./technical/performance-guide.md) - Optimization
- [Troubleshooting](./technical/troubleshooting.md) - Common issues
- [Platform Information](./technical/platform-info.md) - Requirements and dependencies
- [API Testing Examples](./qa/api-testing-examples.md) - Test cases
- [Practical Examples](./qa/practical-examples.md) - Usage patterns
