# QA - Practical Examples

This document provides practical examples and use cases for the LLM Server features, demonstrating real-world scenarios and implementation patterns.

---

## Overview

These examples show how to use the LLM Server features in practical scenarios, from simple operations to complex workflows.

### Example Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Example Categories                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Chat        │  Chat session examples                        │
│  │  Examples    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  RAG         │  RAG operation examples                       │
│  │  Examples    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Prompts     │  Prompt usage examples                        │
│  │  Examples    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Tools       │  Tool creation and execution                  │
│  │  Examples    │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Session Examples

### Example 1: Simple Chat

```javascript
// Create a chat session
async function createChat() {
  const chatId = await axios.post('http://localhost:3000/api/chats', {
    session_name: 'My First Chat'
  });
  
  return chatId.data.data.chat_id;
}

// Add a message
async function sendMessage(chatId, message) {
  const response = await axios.post(
    `http://localhost:3000/api/chats/${chatId}/messages`,
    {
      content: 'What is RAG?'
    }
  );
  
  return response.data.data;
}
```

### Example 2: Multi-Turn Conversation

```javascript
// Multi-turn chat with context
async function multiTurnChat() {
  const chatId = await createChat('Technical Discussion');
  
  // Turn 1
  let response = await sendMessage(chatId, 'Explain RAG');
  console.log('Turn 1:', response.content);
  
  // Turn 2 - Follow-up question
  response = await sendMessage(chatId, 'How does it differ from traditional search?');
  console.log('Turn 2:', response.content);
  
  // Turn 3 - Request for examples
  response = await sendMessage(chatId, 'Can you give me a code example?');
  console.log('Turn 3:', response.content);
  
  // Update memory with key points
  await axios.put(
    `http://localhost:3000/api/chats/${chatId}/memory`,
    {
      conversation_summary: 'User asked about RAG, differences from traditional search, and code examples',
      key_points: [
        'RAG retrieves relevant documents before generating response',
        'Improves accuracy over standard LLM responses',
        'Uses semantic search for relevance'
      ],
      entities: ['RAG', 'semantic search', 'documents']
    }
  );
}
```

### Example 3: Chat with RAG

```javascript
// Chat with RAG enabled
async function chatWithRAG() {
  const chatId = await createChat('Document Analysis');
  
  // Upload document first
  await uploadDocument('report.pdf');
  
  // Chat with document context
  const response = await sendMessage(chatId, 'Summarize the key findings');
  
  console.log('Response with RAG context:', response.content);
  
  // The response will include relevant document chunks
  console.log('Used context:', response.context_used);
}
```

---

## RAG Examples

### Example 1: Upload and Process Document

```javascript
// Upload a document for RAG
async function uploadDocument(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  const response = await axios.post(
    'http://localhost:3000/api/rag/documents',
    formData,
    {
      headers: {
        'Authorization': 'Bearer TOKEN',
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data.data.document_id;
}

// Check processing status
async function checkDocumentStatus(documentId) {
  const response = await axios.get(
    `http://localhost:3000/api/rag/documents/${documentId}`
  );
  
  const status = response.data.data.status;
  console.log(`Processing status: ${status}`);
  
  return status;
}

// Get processed chunks
async function getChunks(documentId) {
  const response = await axios.get(
    `http://localhost:3000/api/rag/documents/${documentId}/chunks`
  );
  
  return response.data.data;
}
```

### Example 2: Semantic Search

```javascript
// Search for relevant content
async function semanticSearch(query, topK = 5) {
  const response = await axios.post(
    'http://localhost:3000/api/rag/search',
    {
      query,
      top_k: topK,
      min_score: 0.7
    }
  );
  
  const results = response.data.data;
  
  // Display results
  results.forEach((result, index) => {
    console.log(`\nResult ${index + 1}:`);
    console.log(`Score: ${result.score}`);
    console.log(`Content: ${result.content}`);
  });
  
  return results;
}

// Batch search with multiple queries
async function batchSearch(queries) {
  const results = await Promise.all(
    queries.map(query => semanticSearch(query, 3))
  );
  
  return results;
}
```

### Example 3: RAG-Powered Chat

```javascript
// Chat with RAG context
async function ragChat(query, context = null) {
  const ragContext = await searchDocuments(query, 3);
  
  // Build prompt with context
  const prompt = buildPromptWithContext(query, ragContext);
  
  // Send to LLM
  const response = await axios.post(
    'http://localhost:3000/api/llama/chat/completions',
    {
      model: 'llama-3-8b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ]
    }
  );
  
  return response.data.data.choices[0].message.content;
}

// Build prompt with RAG context
function buildPromptWithContext(question, context) {
  const contextText = context.map((chunk, i) => 
    `Document ${i + 1}: ${chunk.content}`
  ).join('\n\n');
  
  return `
    Context:
    ${contextText}
    
    Question: ${question}
    
    Please answer the question using the provided context.
  `;
}
```

---

## Prompt Examples

### Example 1: Create Prompt Template

```javascript
// Create a code review prompt
async function createCodeReviewPrompt() {
  const prompt = await axios.post('http://localhost:3000/api/prompts', {
    name: 'Code Review',
    description: 'Review code for best practices',
    content: `Review the following code for:
1. Performance issues
2. Security vulnerabilities
3. Best practices
4. Code style

Code: {{code}}`,
    type: 'instruct',
    tags: ['review', 'code'],
    variables: [
      {
        name: 'code',
        description: 'The code to review',
        required: true,
        type: 'string'
      }
    ]
  });
  
  return prompt.data.data.prompt_id;
}

// Create a data analysis prompt
async function createDataAnalysisPrompt() {
  const prompt = await axios.post('http://localhost:3000/api/prompts', {
    name: 'Data Analysis',
    description: 'Analyze data and provide insights',
    content: `Analyze the following data and provide insights:

Data: {{data}}

Please provide:
1. Summary of findings
2. Key trends
3. Recommendations`,
    type: 'instruct',
    tags: ['analysis', 'data'],
    variables: [
      {
        name: 'data',
        description: 'The data to analyze',
        required: true,
        type: 'string'
      }
    ]
  });
  
  return prompt.data.data.prompt_id;
}
```

### Example 2: Execute Prompt with Variables

```javascript
// Execute code review prompt
async function executeCodeReview(promptId, code) {
  const response = await axios.post(
    'http://localhost:3000/api/prompts/execute',
    {
      prompt_id: promptId,
      variables: {
        code: `function add(a, b) {
  return a + b;
}`
      }
    }
  );
  
  return response.data.data.output;
}

// Execute with multiple variables
async function executeWithVariables(promptId, variables) {
  const response = await axios.post(
    'http://localhost:3000/api/prompts/execute',
    {
      prompt_id: promptId,
      variables
    }
  );
  
  return response.data.data;
}

// Batch execute prompts
async function batchExecute(prompts, variables) {
  const results = await Promise.all(
    prompts.map(prompt => executeWithVariables(prompt.id, variables))
  );
  
  return results;
}
```

### Example 3: Public Prompt Sharing

```javascript
// Create public prompt
async function createPublicPrompt() {
  const prompt = await axios.post('http://localhost:3000/api/prompts', {
    name: 'SQL Query Generator',
    description: 'Generate SQL queries from natural language',
    content: `Generate SQL query for: {{query}}`,
    type: 'chat',
    tags: ['sql', 'database'],
    is_public: true,
    variables: [
      {
        name: 'query',
        description: 'Natural language query',
        required: true,
        type: 'string'
      }
    ]
  });
  
  // Get public prompts
  const publicPrompts = await axios.get('http://localhost:3000/api/prompts/public');
  
  return publicPrompts.data.data;
}
```

---

## Tool Examples

### Example 1: Create Custom Tool

```javascript
// Create file search tool
async function createFileSearchTool() {
  const tool = await axios.post('http://localhost:3000/api/tools', {
    name: 'File Search',
    description: 'Search for files matching pattern',
    code: `const fs = require('fs');

function searchFiles(pattern) {
  const files = fs.readdirSync('./');
  return files.filter(file => file.includes(pattern));
}`,
    parameters: [
      {
        name: 'pattern',
        type: 'string',
        required: true,
        description: 'Search pattern (e.g., *.js)'
      }
    ],
    is_active: true,
    return_type: 'array'
  });
  
  return tool.data.data.tool_id;
}

// Create data transformation tool
async function createDataTransformTool() {
  const tool = await axios.post('http://localhost:3000/api/tools', {
    name: 'Data Transform',
    description: 'Transform data format',
    code: `function transformData(data, format) {
  switch(format) {
    case 'json': return JSON.stringify(data);
    case 'csv': return csvFormat(data);
    default: return data;
  }
}`,
    parameters: [
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Data to transform'
      },
      {
        name: 'format',
        type: 'string',
        required: true,
        description: 'Output format'
      }
    ],
    is_active: true,
    return_type: 'string'
  });
  
  return tool.data.data.tool_id;
}
```

### Example 2: Execute Tool

```javascript
// Execute file search tool
async function executeFileSearch(pattern) {
  const response = await axios.post(
    `http://localhost:3000/api/tools/${toolId}/execute`,
    {
      pattern: '*.js'
    }
  );
  
  return response.data.data.result;
}

// Execute with validation
async function executeWithValidation(toolId, parameters) {
  // Validate parameters
  const validatedParams = validateParameters(parameters);
  
  // Execute tool
  const response = await axios.post(
    `http://localhost:3000/api/tools/${toolId}/execute`,
    validatedParams
  );
  
  // Validate result
  const result = response.data.data.result;
  
  if (!isValidResult(result)) {
    throw new Error('Invalid tool result');
  }
  
  return result;
}

// Execute tool with timeout
async function executeWithTimeout(toolId, parameters, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await axios.post(
      `http://localhost:3000/api/tools/${toolId}/execute`,
      parameters,
      {
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    return response.data.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Tool execution timeout');
    }
    throw error;
  }
}
```

### Example 3: Tool Management

```javascript
// List all tools
async function listTools() {
  const response = await axios.get('http://localhost:3000/api/tools');
  return response.data.data;
}

// Get active tools
async function getActiveTools() {
  const response = await axios.get('http://localhost:3000/api/tools?active=true');
  return response.data.data;
}

// Update tool
async function updateTool(toolId, updates) {
  const response = await axios.put(
    `http://localhost:3000/api/tools/${toolId}`,
    updates
  );
  
  return response.data.data;
}

// Delete tool
async function deleteTool(toolId) {
  await axios.delete(`http://localhost:3000/api/tools/${toolId}`);
}
```

---

## Integration Examples

### Example 1: Complete Workflow

```javascript
// Complete RAG workflow
async function completeRAGWorkflow(documentPath, query) {
  // 1. Upload document
  const docId = await uploadDocument(documentPath);
  
  // 2. Wait for processing
  while (true) {
    const status = await checkDocumentStatus(docId);
    if (status === 'processed') break;
    await sleep(1000);
  }
  
  // 3. Search for relevant content
  const context = await searchDocuments(query, 5);
  
  // 4. Generate response with context
  const response = await generateResponse(query, context);
  
  return {
    document: docId,
    query: query,
    context: context,
    response: response
  };
}

// Complete chat workflow
async function completeChatWorkflow() {
  // 1. Create chat session
  const chatId = await createChat('Project Discussion');
  
  // 2. Add initial message
  let response = await sendMessage(chatId, 'What are the project requirements?');
  
  // 3. Continue conversation
  response = await sendMessage(chatId, 'Can you elaborate on the database requirements?');
  
  // 4. Update memory
  await updateMemory(chatId, {
    conversation_summary: 'Discussed project requirements and database needs',
    key_points: ['Requirements defined', 'Database needs identified']
  });
  
  return chatId;
}
```

### Example 2: Error Handling

```javascript
// Robust error handling
async function robustOperation(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('Operation failed:', error.message);
    
    if (fallback) {
      console.log('Using fallback:', fallback);
      return fallback;
    }
    
    throw error;
  }
}

// Retry with backoff
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1} in ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

---

## Tags

- `qa` - QA examples
- `examples` - Practical examples
- `chat` - Chat examples
- `rag` - RAG examples

---

## Related Documentation

- [API Testing Examples](./api-testing-examples.md) - API test cases
- [API Endpoints](../api/api-endpoints.md) - Complete API reference
- [Features](../features/) - Feature documentation
