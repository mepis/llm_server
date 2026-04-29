# Database Schema

This document provides detailed information about the MongoDB database schema, including collection structures, indexes, and data models.

---

## Overview

The LLM Server uses MongoDB as its primary database. All collections are organized around user-centric data with proper indexing for efficient queries.

### Database Connection

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Connection                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Environment │                                               │
│  │  Variable    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  MONGODB_URI │  mongodb://localhost:27017/llm_server       │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Connection │                                               │
│  │  Pool       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Collections │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Collections

### Users Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users Collection                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  username    │  String (unique, 3-50 chars, trimmed)       │
│  │  email       │  String (unique, lowercase, validated)      │
│  │  password    │  String (Argon2 hash)                        │
│  │  roles       │  String[] (user, admin, system)              │
│  │  is_active   │  Boolean                                      │
│  │  created_at  │  Timestamp                                    │
│  │  last_login  │  Timestamp                                    │
│  │  preferences │  Object (theme, default_model, language)     │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • username  │  Unique                                     │
│  │  • email     │  Unique                                     │
│  │  • roles     │  Compound (for role queries)                │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ChatSessions Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                      ChatSessions Collection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  user_id     │  ObjectId (references Users)                 │
│  │  session_name│  String (1-100 chars, trimmed)              │
│  │  messages    │  Array of message objects                    │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  │  memory      │  Object (conversation context)               │
│  │  metadata    │  Object (LLM settings)                       │
│  │  rag_enabled │  Boolean                                      │
│  │  rag_document_ids│  ObjectId[]                             │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Message     │  ┌──────────────┐                            │
│  │  []          │  │  role         │  user/assistant/system    │
│  │              │  │  content      │  String                    │
│  │              │  │  timestamp    │  Timestamp                │
│  │              │  │  metadata     │  Object (optional)        │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • user_id   │  Indexed                                    │
│  │  • updated_at│  Indexed (for sorting)                      │
│  │  • user_id,  │  Compound (for user sessions)               │
│  │    updated_at│                                            │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### RAGDocuments Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                      RAGDocuments Collection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  user_id     │  ObjectId (references Users)                 │
│  │  filename    │  String (document filename)                 │
│  │  file_type   │  String (pdf, txt, doc, docx, md, json)     │
│  │  file_size   │  Number (bytes)                              │
│  │  file_path   │  String (storage path)                      │
│  │  content     │  String (extracted text)                     │
│  │  embeddings  │  [[Number]] (vector embeddings)              │
│  │  chunks      │  Array of chunk objects                      │
│  │  metadata    │  Object (source, tags, etc.)                 │
│  │  status      │  String (uploaded, processing, indexed)      │
│  │  error       │  String (if processing failed)               │
│  │  uploaded_at │  Timestamp                                    │
│  │  processed_at│  Timestamp                                    │
│  │  embedding_model│  String (embedding model name)           │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Chunk       │  ┌──────────────┐                            │
│  │  []          │  │  text        │  String                    │
│  │              │  │  embedding   │  [Number]                   │
│  │              │  │  chunk_index │  Number                     │
│  │              │  │  tokens      │  Number                     │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • user_id   │  Indexed                                    │
│  │  • status    │  Indexed                                    │
│  │  • user_id,  │  Compound (for user docs)                   │
│  │    status    │                                            │
│  │  • filename  │  Text (for search)                          │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prompts Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                        Prompts Collection                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  user_id     │  ObjectId (references Users)                 │
│  │  name        │  String (1-100 chars, trimmed)              │
│  │  description │  String (0-500 chars)                        │
│  │  content     │  String (prompt template)                   │
│  │  type        │  String (chat, completion, instruct)        │
│  │  tags        │  String[]                                    │
│  │  is_public   │  Boolean                                      │
│  │  variables   │  Array of variable objects                  │
│  │  usage_count │  Number                                       │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  │  settings    │  Object (LLM settings)                       │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Variable    │  ┌──────────────┐                            │
│  │  []          │  │  name        │  String                    │
│  │              │  │  description │  String                    │
│  │              │  │  required    │  Boolean                   │
│  │              │  │  type        │  String                    │
│  │              │  │  default     │  String/Number/Object      │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • user_id   │  Indexed                                    │
│  │  • type     │  Indexed (for filtering)                    │
│  │  • is_public│  Partial index (for public prompts)         │
│  │  • tags     │  Text (for tag search)                       │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tools Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tools Collection                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  user_id     │  ObjectId (references Users)                 │
│  │  name        │  String (unique, 1-100 chars)               │
│  │  description │  String (0-500 chars)                        │
│  │  code        │  String (JavaScript code)                   │
│  │  parameters  │  Array of parameter objects                 │
│  │  is_active   │  Boolean                                      │
│  │  return_type │  String (string, number, boolean)           │
│  │  metadata    │  Object (version, author, examples)         │
│  │  usage_count │  Number                                       │
│  │  created_at  │  Timestamp                                    │
│  │  updated_at  │  Timestamp                                    │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Parameter   │  ┌──────────────┐                            │
│  │  []          │  │  name        │  String                    │
│  │              │  │  type        │  String                    │
│  │              │  │  required    │  Boolean                   │
│  │              │  │  description │  String                    │
│  │              │  │  default     │  String/Number/Object      │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • name      │  Unique                                     │
│  │  • user_id   │  Indexed                                    │
│  │  • is_active │  Indexed                                    │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Logs Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                        Logs Collection                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, auto-generated)           │
│  │  log_level   │  String (error, warn, info, debug)          │
│  │  service     │  String (service name)                       │
│  │  message     │  String (log message)                        │
│  │  metadata    │  Object (request, user, timing)              │
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
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Indexes     │                                               │
│  │              │                                               │
│  │  • _id       │  Unique                                     │
│  │  • timestamp│  Indexed (for time queries)                 │
│  │  • log_level│  Indexed (for level filtering)              │
│  │  • service  │  Indexed (for service filtering)            │
│  │  • user_id  │  Indexed (for user logs)                    │
│  │  • service, │  Compound (for service + level)             │
│  │    log_level│                                            │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Indexes Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    Index Summary                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Collection  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Users:                                                  │   │
│  │  • _id (Unique)                                          │   │
│  │  • username (Unique)                                     │   │
│  │  • email (Unique)                                        │   │
│  │  • roles (Compound)                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ChatSessions:                                           │   │
│  │  • _id (Unique)                                          │   │
│  │  • user_id (Indexed)                                     │   │
│  │  • updated_at (Indexed)                                  │   │
│  │  • user_id + updated_at (Compound)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RAGDocuments:                                           │   │
│  │  • _id (Unique)                                          │   │
│  │  • user_id (Indexed)                                     │   │
│  │  • status (Indexed)                                      │   │
│  │  • user_id + status (Compound)                           │   │
│  │  • filename (Text)                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Prompts:                                                │   │
│  │  • _id (Unique)                                          │   │
│  │  • user_id (Indexed)                                     │   │
│  │  • type (Indexed)                                        │   │
│  │  • is_public (Partial)                                   │   │
│  │  • tags (Text)                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Tools:                                                  │   │
│  │  • _id (Unique)                                          │   │
│  │  • name (Unique)                                         │   │
│  │  • user_id (Indexed)                                     │   │
│  │  • is_active (Indexed)                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Logs:                                                   │   │
│  │  • _id (Unique)                                          │   │
│  │  • timestamp (Indexed)                                   │   │
│  │  • log_level (Indexed)                                   │   │
│  │  • service (Indexed)                                     │   │
│  │  • user_id (Indexed)                                     │   │
│  │  • service + log_level (Compound)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
 │  │  DocumentGroups:                                         │   │
  │  │  • id (Unique)                                           │   │
  │  │  • owner_id (Indexed)                                    │   │
  │  │  • roles (Indexed - prefix)                              │   │
  │  │  • name + owner_id (Compound Unique)                    │   │
  │  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  UserMemories:                                           │   │
│  │  • _id (Unique)                                          │   │
│  │  • user_id + layer + created_at (Compound)               │   │
│  │  • metadata.expires_at (TTL Index)                       │   │
│  │  • keywords/tags (Text Search)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Collections (2026-04-23)

### DocumentGroups Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | VARCHAR(36) | Unique identifier (UUID) |
| `name` | VARCHAR(100) | Group name (unique per owner) |
| `description` | TEXT | Group description |
| `owner_id` | VARCHAR(36) (ref: users.id) | Group creator/owner |
| `roles` | JSON | RBAC roles for visibility, e.g. `["user"]`, `["admin"]` |
| `documents` | JSON | [{ document_id, added_by, added_at }] |
| `created_at` | TIMESTAMP | Auto-generated |
| `updated_at` | TIMESTAMP | Auto-generated on update |

Access is controlled via `JSON_OVERLAPS(group.roles, user.roles)`. The group owner and global admins can modify groups and manage documents.

### UserMemories Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Unique identifier |
| `user_id` | ObjectId (ref: User) | Memory owner |
| `layer` | Enum | episodic, semantic, procedural |
| `content` | String | PII-redacted memory content |
| `embedding` | [Number] | Vector embedding for semantic search |
| `metadata.source_session_id` | ObjectId (ref: ChatSession) | Source session reference |
| `metadata.keywords` | String[] | Extracted keywords |
| `metadata.confidence` | Number | 0-1 confidence score |
| `metadata.expires_at` | Timestamp | TTL for episodic memories (30 days) |
| `metadata.access_count` | Number | Track access frequency |
| `tags` | String[] | For text search |
| `created_at` | Timestamp | Auto-generated |
| `updated_at` | Timestamp | Auto-generated |

---

## Tags

- `mongodb` - MongoDB database
- `database-schema` - Database schema
- `architecture` - System architecture

---

## Related Documentation

- [System Architecture](./system-architecture.md) - Overall architecture
- [Worker Threads](./worker-threads.md) - Worker thread pool
- [API Endpoints](../api/api-endpoints.md) - API reference
