# Phase 3: Citation System - Detailed Todo List

**Phase**: 3 of 6  
**Dependencies**: Phase 1 (DocumentParser), Phase 2 (DocumentGroups for broader search scope)  
**Estimated effort**: ~2-3 days  

---

## Purpose

Every RAG-assisted chat response includes inline citations `[1]`, `[2]` linking back to source documents and chunks. This ensures traceability and prevents hallucination by grounding responses in verified sources.

---

## Task 3.1: Update ragService.searchDocuments() Return Format

**File**: `src/services/ragService.js`

- [ ] Modify search results format to include per-chunk citation data:
  ```javascript
  // Instead of returning full doc objects, return structured results:
  {
    success: true,
    data: {
      results: [{
        text: chunk.text,
        document_id: doc._id.toString(),
        filename: doc.filename,
        file_type: doc.file_type,
        chunk_index: chunk.chunk_index,
        similarity: maxSimilarity,
        sheet_name: doc.sheets?.[chunk.chunk_index] || null  // for XLSX
      }],
      sources: [{
        document_id: doc._id.toString(),
        filename: doc.filename,
        file_type: doc.file_type,
        total_chunks_used: countOfChunksUsed,
        sheets: doc.sheets || []
      }]
    }
  }
  ```

- [ ] Deduplicate sources array (one entry per unique document)
- [ ] Keep results sorted by similarity descending
- [ ] Cap at `limit` total results across all chunks

**Acceptance criteria:**
- Search returns structured results with document_id, filename, chunk_index
- Sources array contains unique documents with metadata
- Sheet names included for XLSX documents when applicable

---

## Task 3.2: Create CitationBuilder Utility

**File**: `src/utils/citationBuilder.js`

- [ ] Implement `buildCitations(results)`:
  - Takes search results from ragService
  - Assigns numeric IDs starting from 1
  - Returns `{ citations: [{ id, text, source }], citationMap: { chunkIndex: citationId } }`
  
- [ ] Implement `formatCitationText(text, citations)`:
  - Takes raw LLM response text and citations
  - Appends `[n]` markers to sentences that reference cited content
  - Returns formatted text with citation markers
  
- [ ] Implement `generateSourceList(citations)`:
  - Takes citations array
  - Returns markdown-formatted source list:
    ```markdown
    **Sources:**
    1. [filename.pdf](/rag/documents/:id) — similarity: 0.92, chunk: 5
    2. [data.csv](/rag/documents/:id) — similarity: 0.87, sheet: Sheet1
    ```

- [ ] Implement `buildRAGSystemMessage(query, userId)`:
  - Calls ragService.searchDocuments(userId, query, 5)
  - Passes results through CitationBuilder
  - Returns `{ systemContent, citations }` for chatService integration
  
- [ ] System message template:
  ```
  Use the following context from your knowledge base. Each fact is cited with a bracketed number [n]. Always include citations in your response. Reference sources at the end of your answer.

  <context>
  {formatted context chunks with citation markers}
  </context>
  ```

**Acceptance criteria:**
- buildCitations assigns unique sequential IDs to each result chunk
- generateSourceList produces valid markdown with clickable document links
- buildRAGSystemMessage returns properly formatted system message with citations
- Citation markers in output text correspond to correct source documents

---

## Task 3.3: Update chatService.runLoop() and streamRunLoop()

**File**: `src/services/chatService.js`

- [ ] Import citationBuilder at top of file
- [ ] Replace current RAG context building (lines 259-270, 360-370) with new approach:
  ```javascript
  let ragCitations = [];
  if (session.rag_enabled && session.rag_document_ids.length > 0) {
    const ragResult = await ragService.searchDocuments(
      userId, content, 5, session.rag_document_ids
    );
    if (ragResult?.data?.results?.length > 0) {
      const citationData = citationBuilder.buildCitations(ragResult.data);
      ragCitations = citationData.citations;
      ragContext = formatRAGContextChunks(ragResult.data.results);
    }
  }
  ```

- [ ] Update system message building:
  ```javascript
  let systemMessage = 'You are a helpful assistant.';
  if (ragContext) {
    systemMessage += `\n\nKnowledge base context:\n${ragContext}\n\nCite your sources using bracketed numbers [1], [2] etc.`;
  }
  ```

- [ ] Store citations in assistant message metadata:
  ```javascript
  await session.addMessage('assistant', contentText, {
    model: session.metadata?.model || 'llama-3-8b',
    citations: ragCitations.map(c => ({
      source_id: c.source.document_id,
      filename: c.source.filename,
      chunk_index: c.source.chunk_index,
      similarity: c.source.similarity
    }))
  });
  ```

**Acceptance criteria:**
- RAG-assisted responses include citation markers in the text
- Citation metadata stored in session message for frontend rendering
- No citations when RAG is disabled or no relevant documents found

---

## Task 3.4: Update ChatSession Message Schema

**File**: `src/models/ChatSession.js`

- [ ] Add `citations` to message metadata schema (line 40):
  ```javascript
  // In the messages array schema, metadata field already uses Mixed type
  // Add documentation/example for citations structure:
  metadata.citations: [{
    source_id: String,
    filename: String,
    chunk_index: Number,
    similarity: Number,
    text_snippet: String  // brief preview of the cited content
  }]
  ```

- [ ] Since metadata is `Mixed` type, no schema change needed — just document the expected structure

**Acceptance criteria:**
- Message metadata can store citations array without validation errors
- Citations survive session persistence (MongoDB save/load)

---

## Task 3.5: Create Citation Display in Frontend ChatView

**File**: `frontend/src/views/chat/ChatView.vue` (or wherever chat messages are rendered)

- [ ] After rendering assistant message content, add collapsible Sources section:
  ```vue
  <div v-if="message.metadata?.citations?.length" class="sources-section">
    <Button label="Show Sources" @click="showSources = !showSources" text />
    <div v-if="showSources" class="sources-list">
      <div v-for="citation in message.metadata.citations" :key="citation.source_id" 
           class="source-item">
        <span class="source-score">{{ (citation.similarity * 100).toFixed(0) }}%</span>
        <span class="source-name">{{ citation.filename }}</span>
        <span class="source-chunk">Chunk {{ citation.chunk_index }}</span>
      </div>
    </div>
  </div>
  ```

- [ ] Style the sources section with PrimeVue styling conventions
- [ ] Clicking a source item navigates to RAGDocumentsView filtered to that document_id

**Acceptance criteria:**
- Sources panel appears below assistant messages that have citations
- Each source shows filename, similarity score, and chunk index
- Panel is collapsible to save screen space
- Source click navigation works correctly

---

## Notes for Implementers

- The LLM itself should be prompted to include citations — the backend can't reliably inject them into already-generated text. The prompt in the system message is the primary mechanism.
- For streaming responses, citation metadata arrives at the end (when the full response is available), so show sources after stream completes.
- Consider a minimum similarity threshold (e.g., 0.5) before including a result as a citation — very low similarity results may be irrelevant.
