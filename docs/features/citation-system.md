tags: [citations, rag, knowledge-base]
role: [developer]

# Citation System

Inline source citations for RAG-powered LLM responses.

## Overview

The Citation System attaches source references to LLM responses generated from RAG search results. Citations are built from search result metadata, injected as inline bracketed numbers into the response text, and displayed as a formatted source list at the end. They are also stored in session message metadata for later reference.

**Utility:** `src/utils/citationBuilder.js`

## Citation Data Structure

```
+-----------------------------------------------+
| Citation Entry                                |
+-----------------------------------------------+
| id             Number (1-based index)         |
| text           String (chunk snippet)         |
| source:                               |       |
|   document_id  ObjectId (RAGDocument)         |
|   filename     String                         |
|   file_type    String                         |
|   chunk_index  Number                         |
|   similarity   Number (0-1)                   |
|   sheet_name   String (optional, spreadsheets)|
+-----------------------------------------------+

Citation Map:
  chunk_index -> citation id
  Used for matching sentences to their source chunks
```

## API Flow

```
User sends query with RAG enabled
        |
        v
+------------------+
| RAG search in    |
| RAGDocument      |
| collection       |
+------------------+
        |
        v
+------------------------+     Results: [{ text, document_id,   |
| buildCitations()       |      filename, chunk_index,         |
| citationBuilder.js     |      similarity, sheet_name }]      |
+------------------------+
        |
        v
+-------------------------------+
| Output:                       |
| citations: [                   |
|   { id:1, text:"...", source:{...} },  |
|   { id:2, text:"...", source:{...} }   |
| ],                            |
| citationMap: {                 |
|   0: 1,                        |
|   3: 2                         |
| }                              |
+-------------------------------+
        |
        v
+---------------------------+
| deterministicInjectCitations() |
| - Split response into       |
|   sentences                  |
| - For each sentence:        |
|   compute text similarity    |
|   to each search result      |
|   (word overlap, min 3 chars)|
| - If best match >= 0.3:     |
|   append [n] to sentence     |
+---------------------------+
        |
        v
+---------------------------+
| formatSourceList()        |
| - Group by document       |
| - Show highest similarity |
| - List sheet names        |
| - Format: "85% [file.pdf](docId)" |
+---------------------------+
        |
        v
  Final response with inline citations + source list
```

## Inline Citation Injection

The `deterministicInjectCitations()` function processes the LLM-generated text:

1. Splits text into sentences using regex `[^.!?]+[.!?]+`
2. Skips sentences shorter than 10 characters
3. For each sentence, computes word-overlap similarity against all search result chunks
4. If best match has similarity >= 0.3, appends `[citationId]` to the sentence

### Similarity Computation

```javascript
computeTextSimilarity(text1, text2):
  words1 = split(text1) filtered: lowercase, length > 3
  words2 = split(text2) filtered: lowercase, length > 3
  overlap = count of shared words
  return overlap / max(words1.size, words2.size)
```

Sentences with no matching chunks above the 0.3 threshold remain uncited.

## Source List Format

The `formatSourceList()` function produces a deduplicated source reference at the end of the response:

```
**Sources:**
85% [spec.pdf](doc_abc123) — chunk
72% [api-reference.md](doc_def456) — chunk, sheet: Overview
91% [config.json](doc_ghi789) — chunk
```

Each unique document appears once with its highest similarity score. Spreadsheet sheets are listed if present.

## System Message Injection (RAG Context)

When RAG is enabled for a chat session, the system message includes citation instructions:

```
Here is relevant context from the knowledge base:

[chunk text 1] [1]
[chunk text 2] [2]

Please answer using only the information above.
Cite sources using bracketed numbers matching the citation indices.
```

The RAG search results are formatted into this context block with citation indices before being passed to the LLM alongside the user message.

## Response Format

### With Citations

```json
{
  "success": true,
  "data": {
    "content": "The project uses Node.js for the backend [1]. MongoDB stores chat sessions [2].",
    "citations": [
      { "id": 1, "text": "...", "source": { "document_id": "...", "filename": "README.md", ... } },
      { "id": 2, "text": "...", "source": { "document_id": "...", "filename": "ARCHITECTURE.md", ... } }
    ]
  }
}
```

### Stored in Session

Citations are stored in the chat session's message metadata as a `citations` array, enabling later display of source attribution alongside conversation history.

## Citation Injection Data Structure Schema

```
+-----------------------------------------------------+
| RAG Response with Citations                         |
+-----------------------------------------------------+
| content: "Text [1] with [2] inline citations."      |
|                                                     |
| response_metadata:                                  |
|   citations: [                                      |
|     {                                               |
|       id: 1,                                        |
|       text: "RAG chunk snippet...",                 |
|       source: {                                    |
|         document_id: "507f1f79bcf86cd...",          |
|         filename: "README.md",                      |
|         file_type: "markdown",                      |
|         chunk_index: 0,                             |
|         similarity: 0.85,                           |
|         sheet_name: null                            |
|       }                                             |
|     },                                              |
|     {                                               |
|       id: 2,                                        |
|       text: "Another chunk...",                     |
|       source: { ... }                               |
|     }                                               |
|   ],                                                |
|                                                     |
|   sources_formatted:                                |
|     "**Sources:**\n" +                              |
|     "85% [README.md](doc_id) — chunk\n"             |
|   ]                                                  |
+-----------------------------------------------------+
```

## Empty Results Handling

If no RAG search results are found, or results array is empty:

- `buildCitations()` returns `{ citations: [], citationMap: {} }`
- `deterministicInjectCitations()` returns original text unchanged
- `formatSourceList()` returns empty string

No citations block is appended to the response.

## Related Pages

- [RAG Documents](./rag-documents.md) — document storage and search
- [Chat Sessions](./chat-sessions.md) — session message metadata storage
- [API Reference](../api/rag-api.md)
