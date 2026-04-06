# RAG System

This document covers the Retrieval-Augmented Generation (RAG) system in LLM Server, including document processing, embedding generation, semantic search, and chunk management.

---

## Overview

The RAG system enables context-aware responses by retrieving relevant documents and incorporating them into LLM prompts. Key capabilities include:

- Document upload and processing
- Text extraction from multiple formats
- Embedding generation and storage
- Semantic search with vector similarity
- Chunk-based document processing
- Status tracking and progress monitoring

### RAG System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      RAG System Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  User        │                                               │
│  │  uploads     │                                               │
│  │  document    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  API         │                                               │
│  │  Endpoint    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  RAG         │                                               │
│  │  Service     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  Worker      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Process     │                                               │
│  │  document    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Extract     │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Chunk       │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  embeddings  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Store in    │                                               │
│  │  Database    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document Schema

### RAG Document Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      RAG Document Schema                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  _id         │  ObjectId (unique, indexed)                  │
│  │  user_id     │  ObjectId (references User)                   │
│  │  filename    │  String (document filename)                  │
│  │  file_type   │  String (pdf, txt, doc, docx, md, json)      │
│  │  file_size   │  Number (bytes)                              │
│  │  file_path   │  String (storage path)                       │
│  │  content     │  String (extracted text)                     │
│  │  embeddings  │  [[Number]] (vector embeddings)              │
│  │  chunks      │  Array of chunk objects                      │
│  │  metadata    │  Object                                      │
│  │  status      │  String (uploaded, processing, indexed)      │
│  │  error       │  String (if processing failed)               │
│  │  uploaded_at │  Timestamp                                    │
│  │  processed_at│  Timestamp                                    │
│  │  embedding_model│  String (embedding model name)           │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Chunk       │  ┌──────────────┐                            │
│  │  []          │  │  text        │  String                     │
│  │              │  │  embedding   │  [Number]                   │
│  │              │  │  chunk_index │  Number                     │
│  │              │  │  tokens      │  Number                     │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Metadata    │  ┌──────────────┐                            │
│  │  []          │  │  source_url  │  String                     │
│  │              │  │  description │  String                     │
│  │              │  │  tags        │  String[]                   │
│  │              │  │  created_at  │  Timestamp                 │
│  │              │  │  modified_at │  Timestamp                 │
│  │              │  └──────────────┘                            │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document Processing Flow

### Upload and Process Document

```
┌─────────────────────────────────────────────────────────────────┐
│                    Document Processing Flow                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  uploads     │                                               │
│  │  document    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Validate    │                                               │
│  │  file type   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create      │                                               │
│  │  document    │                                               │
│  │  record      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Spawn       │                                               │
│  │  RAG Worker  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Extract     │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Chunk       │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  embeddings  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Store       │                                               │
│  │  in DB       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Update      │                                               │
│  │  status      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  success     │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Text Extraction

### Supported File Types

| Extension | Type | Extraction Method |
|-----------|------|-------------------|
| `.pdf` | PDF | PDF.js text extraction |
| `.txt` | Text | Direct text read |
| `.md` | Markdown | Markdown parser |
| `.json` | JSON | JSON parse |
| `.csv` | CSV | CSV parser |
| `.doc` | Word | docx.js |
| `.docx` | Word | docx.js |

### Text Extraction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Text Extraction Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Read file   │                                               │
│  │  by type     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Detect     │                                               │
│  │  file type   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Apply      │                                               │
│  │  extractor  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Clean      │                                               │
│  │  text       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return     │                                               │
│  │  text       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chunking Strategy

### Chunk Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `chunk_size` | 1000 | Tokens per chunk |
| `chunk_overlap` | 200 | Overlap between chunks |
| `min_tokens` | 100 | Minimum tokens per chunk |
| `max_chunks` | 1000 | Maximum chunks per document |

### Chunking Process

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chunking Process                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Full text   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Tokenize    │                                               │
│  │  text        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Split into  │                                               │
│  │  chunks      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Apply       │                                               │
│  │  overlap     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  embeddings  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Store       │                                               │
│  │  chunks      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Semantic Search

### Search Endpoint

```
POST /api/rag/search
```

### Request Body

```json
{
  "query": "What is the API design?",
  "top_k": 5,
  "min_score": 0.7
}
```

### Response (Success)

```json
{
  "success": true,
  "data": [
    {
      "document_id": "doc_abc123",
      "content": "The API uses RESTful design patterns...",
      "score": 0.92,
      "chunk_index": 12,
      "metadata": {
        "source_url": "https://example.com/api",
        "tags": ["api", "design"]
      }
    },
    {
      "document_id": "doc_def456",
      "content": "The system architecture follows...",
      "score": 0.85,
      "chunk_index": 8,
      "metadata": {
        "source_url": "https://example.com/arch",
        "tags": ["architecture"]
      }
    }
  ]
}
```

### Search Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Search Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Client      │                                               │
│  │  sends       │                                               │
│  │  query       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Generate    │                                               │
│  │  query       │                                               │
│  │  embedding  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Vector      │                                               │
│  │  similarity  │                                               │
│  │  search      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Filter by   │                                               │
│  │  min_score   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Sort by     │                                               │
│  │  score       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Return      │                                               │
│  │  top K       │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### RAG Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/rag/documents` | Upload document | Yes |
| GET | `/api/rag/documents` | List documents | Yes |
| GET | `/api/rag/documents/:id` | Get document | Yes |
| DELETE | `/api/rag/documents/:id` | Delete document | Yes |
| POST | `/api/rag/documents/:id/process` | Process document | Yes |
| POST | `/api/rag/search` | Search documents | Yes |
| GET | `/api/rag/documents/:id/chunks` | Get chunks | Yes |
| PATCH | `/api/rag/documents/:id/settings` | Update settings | Yes |

---

## Tags

- `rag` - Retrieval-augmented generation
- `llm` - LLM inference and embeddings
- `mongodb` - MongoDB database
- `user` - Standard user capabilities

---

## Related Documentation

- [LLM Integration](./llm-integration.md) - Embeddings generation
- [Chat Sessions](./chat-sessions.md) - Context-aware responses
- [Database Schema](../architecture/database-schema.md) - Document model
- [API Endpoints](../api/api-endpoints.md) - Complete API reference

---

## Practical Examples

### Example 1: Upload Document

```javascript
async function uploadDocument(userId, file) {
  const db = await getDB();
  
  const document = {
    user_id: userId,
    filename: file.originalname,
    file_type: file.mimetype,
    file_size: file.size,
    file_path: file.path,
    status: 'uploaded',
    uploaded_at: new Date()
  };
  
  // Create document record
  await db.collection('ragDocuments').insertOne(document);
  
  // Spawn worker for processing
  await piscina.run({
    type: 'rag-process',
    data: {
      filePath: file.path,
      fileType: file.mimetype
    },
    requestId: crypto.randomUUID()
  });
  
  return document._id;
}
```

### Example 2: Search Documents

```javascript
async function searchDocuments(query, topK = 5, minScore = 0.7) {
  const db = await getDB();
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Perform vector similarity search
  const results = await db.collection('ragChunks')
    .find({
      embedding: {
        $cosineDistance: {
          vectors: queryEmbedding,
          maxDistance: 1 - minScore
        }
      }
    })
    .sort({ embedding: 1 })
    .limit(topK)
    .toArray();
  
  // Map to document chunks
  const chunks = await db.collection('ragChunks')
    .find({ _id: { $in: results.map(r => r._id) } })
    .toArray();
  
  return chunks;
}
```

### Example 3: Use RAG in Chat

```javascript
async function getRAGContext(query) {
  // Search for relevant documents
  const results = await searchDocuments(query, 5, 0.8);
  
  // Format as context
  const context = results.map(chunk => ({
    document_id: chunk.document_id,
    content: chunk.text,
    score: chunk.similarity
  }));
  
  return context;
}
```
