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
└─────────────────────────────────────────────────────────────────┘
```

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
