# LLM Server - Documentation Index by Tags

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
| `argon2` | Password hashing | [Authentication](./features/authentication.md), [Security Design](./architecture/security-design.md) |
| `security` | Security best practices | [Security Design](./architecture/security-design.md), [Configuration](./technical/configuration-guide.md) |

### User Roles
Tag documents organized by user role capabilities.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `user` | Standard user capabilities | [Chat Sessions](./features/chat-sessions.md), [RAG System](./features/rag-system.md), [Prompt Management](./features/prompt-management.md) |
| `admin` | Administrative privileges | [User Management](./features/user-management.md), [System Monitoring](./features/system-monitoring.md), [API Endpoints](./api/api-endpoints.md) |
| `system` | System-level operations | [System Monitoring](./features/system-monitoring.md), [Matrix Integration](./features/matrix-integration.md) |

### Core Features
Tag documents for core application features.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `chat` | Chat session management | [Chat Sessions](./features/chat-sessions.md), [LLM Integration](./features/llm-integration.md), [API Endpoints](./api/api-endpoints.md) |
| `llm` | LLM inference and embeddings | [LLM Integration](./features/llm-integration.md), [RAG System](./features/rag-system.md), [Worker Threads](./architecture/worker-threads.md) |
| `rag` | Retrieval-augmented generation | [RAG System](./features/rag-system.md), [LLM Integration](./features/llm-integration.md), [Architecture](./architecture/system-architecture.md) |
| `prompts` | Prompt template management | [Prompt Management](./features/prompt-management.md), [API Endpoints](./api/api-endpoints.md) |
| `tools` | Custom tool execution | [Tool Support](./features/tool-support.md), [API Endpoints](./api/api-endpoints.md) |

### Integration
Tag documents for third-party integrations.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `matrix` | Matrix integration | [Matrix Integration](./features/matrix-integration.md), [System Monitoring](./features/system-monitoring.md) |
| `mongodb` | MongoDB database | [Database Schema](./architecture/database-schema.md), [Worker Threads](./architecture/worker-threads.md) |
| `express` | Express.js framework | [API Endpoints](./api/api-endpoints.md), [Middleware](./components/middleware.md) |
| `vue3` | Vue 3 frontend | [Frontend Components](./components/frontend-components.md), [Pinia Stores](./components/pinia-stores.md) |

### Infrastructure
Tag documents for infrastructure and technical implementation.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `piscina` | Worker thread pool | [Worker Threads](./architecture/worker-threads.md), [LLM Integration](./features/llm-integration.md) |
| `monitoring` | System monitoring | [System Monitoring](./features/system-monitoring.md), [Technical](./technical/performance-guide.md) |
| `logging` | Application logging | [System Monitoring](./features/system-monitoring.md), [Technical](./technical/troubleshooting.md) |
| `deployment` | Deployment guide | [Deployment Guide](./technical/deployment-guide.md), [Configuration](./technical/configuration-guide.md) |

### Technical Components
Tag documents for technical implementation details.

| Tag | Description | Related Pages |
|-----|-------------|---------------|
| `nodejs` | Node.js runtime | [Configuration](./technical/configuration-guide.md), [Deployment](./technical/deployment-guide.md) |
| `middleware` | Express middleware | [Middleware](./components/middleware.md), [API Endpoints](./api/api-endpoints.md) |
| `state-management` | Pinia state management | [Pinia Stores](./components/pinia-stores.md), [Frontend Components](./components/frontend-components.md) |
| `worker-threads` | Worker thread implementation | [Worker Threads](./architecture/worker-threads.md), [Llama Integration](./features/llm-integration.md) |

---

## Tag Cross-Reference

### Feature-Based Tags
These tags group documentation by application features:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Tags Overview                        │
├─────────────────┬──────────────────┬─────────────────────────────┤
│ Authentication  │ User Management   │ Chat Sessions              │
│ ✓ auth          │ ✓ user-management │ ✓ chat                       │
│ ✓ jwt           │ ✓ admin           │ ✓ llm                         │
│ ✓ argon2        │ ✓ system          │ ✓ rag                          │
│                 │                   │ ✓ prompts                      │
│                 │                   │ ✓ tools                         │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ LLM Integration│ RAG System        │ System Monitoring          │
│ ✓ llm           │ ✓ rag              │ ✓ monitoring                   │
│ ✓ piscina       │ ✓ mongodb          │ ✓ logging                      │
│                 │                   │ ✓ admin                      │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ Matrix Bot      │ Prompt Management │ Tool Support                   │
│ ✓ matrix        │ ✓ prompts          │ ✓ tools                        │
│ ✓ system        │ ✓ user             │ ✓ user-management              │
│                 │                   │ ✓ security                   │
└─────────────────┴──────────────────┴─────────────────────────────┘
```

### Role-Based Tags
These tags organize documentation by user role:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Role-Based Documentation                      │
├─────────────────┬──────────────────┬─────────────────────────────┤
│                 │ Admin            │ System                      │
│                 │ ├───────────────┼─────────────────────────────┤
│                 │ │ User Mgmt     │ │ System Monitoring          │
│ User            │ │ API Endpoints │ │ Logs                       │
│ ├───────────────┼─┼───────────────┼─┼─────────────────────────────┤
│ │ Chat          │ │ User Mgmt     │ │ Matrix Integration          │
│ │ RAG           │ │ API Endpoints │ │ Health Checks               │
│ │ Prompts       │ │ Security      │ │ Performance Metrics         │
│ │ Tools         │ │ RBAC          │ │                             │
└─────────────────┴──────────────────┴─────────────────────────────┘
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
4. [Worker Threads](./architecture/worker-threads.md) - Inference workers

### For Developers Working on RAG
Start with:
1. [RAG System](./features/rag-system.md) - Document processing
2. [LLM Integration](./features/llm-integration.md) - Embeddings
3. [Database Schema](./architecture/database-schema.md) - Document model
4. [Worker Threads](./architecture/worker-threads.md) - Processing workers

### For Frontend Developers
Start with:
1. [Frontend Components](./components/frontend-components.md) - Vue components
2. [Pinia Stores](./components/pinia-stores.md) - State management
3. [API Endpoints](./api/api-endpoints.md) - API integration
4. [Configuration](./technical/configuration-guide.md) - Environment setup

### For DevOps/Deployment
Start with:
1. [Deployment Guide](./technical/deployment-guide.md) - Production setup
2. [Configuration](./technical/configuration-guide.md) - Environment variables
3. [Performance Guide](./technical/performance-guide.md) - Optimization
4. [System Monitoring](./features/system-monitoring.md) - Observability

---

## Tag Summary Table

| Tag | Category | Primary Page | Secondary Pages |
|-----|----------|--------------|-----------------|
| `auth` | Feature | Authentication | User Management, Middleware |
| `chat` | Feature | Chat Sessions | LLM Integration, RAG System |
| `llm` | Feature | LLM Integration | RAG System, Worker Threads |
| `rag` | Feature | RAG System | LLM Integration, Database Schema |
| `prompts` | Feature | Prompt Management | API Endpoints |
| `tools` | Feature | Tool Support | API Endpoints |
| `matrix` | Integration | Matrix Integration | System Monitoring |
| `mongodb` | Technical | Database Schema | Worker Threads |
| `piscina` | Technical | Worker Threads | LLM Integration |
| `vue3` | Technical | Frontend Components | Pinia Stores |
| `nodejs` | Technical | Configuration Guide | Deployment Guide |
| `argon2` | Security | Security Design | Authentication |
| `jwt` | Security | Security Design | Authentication |
| `user` | Role | Chat Sessions | RAG System, Tools |
| `admin` | Role | User Management | System Monitoring |
| `system` | Role | System Monitoring | Matrix Integration |
| `monitoring` | Infrastructure | System Monitoring | Performance Guide |
| `logging` | Infrastructure | System Monitoring | Troubleshooting |
| `deployment` | Infrastructure | Deployment Guide | Configuration Guide |
| `express` | Technical | API Endpoints | Middleware |
| `state-management` | Technical | Pinia Stores | Frontend Components |

---

## Related Documentation Links

- [Main Documentation Index](./index.md) - Complete documentation overview
- [API Endpoints](./api-endpoints.md) - Full REST API reference
- [Database Schema](./architecture/database-schema.md) - MongoDB collection definitions
- [Deployment Guide](./technical/deployment-guide.md) - Production deployment instructions

---

## Documentation Links

- [Authentication](./features/authentication.md) - Auth implementation
- [User Management](./features/user-management.md) - User CRUD operations
- [Chat Sessions](./features/chat-sessions.md) - Session management
- [LLM Integration](./features/llm-integration.md) - Llama.cpp integration
- [RAG System](./features/rag-system.md) - Document retrieval
- [Prompt Management](./features/prompt-management.md) - Prompt templates
- [Tool Support](./features/tool-support.md) - Custom tools
- [System Monitoring](./features/system-monitoring.md) - Monitoring capabilities
- [Matrix Integration](./features/matrix-integration.md) - Matrix bot

