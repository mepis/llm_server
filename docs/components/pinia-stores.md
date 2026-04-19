# Pinia Stores

This document covers the Pinia state management stores in LLM Server, which provide centralized state management for the Vue 3 frontend application.

---

## Overview

Pinia stores manage the application state and provide reactive data that can be used throughout the frontend. Each store follows a consistent pattern with state, getters, and actions.

### Store Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                      Store Structure                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  state       │  Reactive state data                         │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  getters     │  Computed values from state                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  actions     │  Async/sync methods to modify state          │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  mutations   │  Direct state mutations (if needed)          │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Auth Store

### Auth Store Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Auth Store Schema                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  state       │                                               │
│  │              │                                               │
│  │  user        │  User object (null if not logged in)         │
│  │              │                                               │
│  │  token       │  JWT token string                             │
│  │              │                                               │
│  │  isAuthenticated│ Boolean (derived from token)            │
│  │              │                                               │
│  │  loading     │  Boolean (during async operations)           │
│  │              │                                               │
│  │  error       │  Error message (if any)                      │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  actions     │                                               │
│  │              │                                               │
│  │  login       │  POST /api/auth/login                        │
│  │              │                                               │
│  │  register    │  POST /api/auth/register                     │
│  │              │                                               │
│  │  logout      │  POST /api/auth/logout                       │
│  │              │                                               │
│  │  fetchUser   │  GET /api/auth/me                            │
│  │              │                                               │
│  │  clearError  │  Clear error state                           │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Auth Store Implementation

```javascript
// stores/auth.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(credentials) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.post('/api/auth/login', credentials);
      token.value = response.data.data.token;
      user.value = response.data.data.user;
      localStorage.setItem('token', token.value);
    } catch (err) {
      error.value = err.response?.data?.error || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(userData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  async function fetchUser() {
    try {
      const response = await axios.get('/api/auth/me');
      user.value = response.data.data;
    } catch (err) {
      console.error('Fetch user error:', err);
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    fetchUser,
    clearError
  };
});
```

---

## Chat Store

### Chat Store Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat Store Schema                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  state       │                                               │
│  │              │                                               │
│  │  sessions    │  Array of chat session objects                │
│  │              │                                               │
│  │  currentChat │  Currently selected chat session              │
│  │              │                                               │
│  │  messages    │  Current chat messages                        │
│  │              │                                               │
│  │  loading     │  Boolean (during async operations)           │
│  │              │                                               │
│  │  error       │  Error message (if any)                      │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  actions     │                                               │
│  │              │                                               │
│  │  createSession│  POST /api/chats                            │
│  │              │                                               │
│  │  listSessions│  GET /api/chats                               │
│  │              │                                               │
│  │  loadChat    │  GET /api/chats/:id                           │
│  │              │                                               │
│  │  addMessage  │  POST /api/chats/:id/messages                 │
│  │              │                                               │
│  │  deleteChat  │  DELETE /api/chats/:id                        │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Chat Store Implementation

```javascript
// stores/chat.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useChatStore = defineStore('chat', () => {
  const sessions = ref([]);
  const currentChat = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function createSession(name) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.post('/api/chats', { session_name: name });
      sessions.value.push(response.data.data);
      currentChat.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create session';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function listSessions() {
    try {
      const response = await axios.get('/api/chats');
      sessions.value = response.data.data;
    } catch (err) {
      console.error('List sessions error:', err);
    }
  }

  async function loadChat(chatId) {
    try {
      const response = await axios.get(`/api/chats/${chatId}`);
      currentChat.value = response.data.data;
      messages.value = response.data.data.messages;
    } catch (err) {
      console.error('Load chat error:', err);
    }
  }

  async function addMessage(content) {
    try {
      const response = await axios.post(`/api/chats/${currentChat.value._id}/messages`, {
        content
      });
      
      messages.value.push(response.data.data);
      return response.data.data;
    } catch (err) {
      console.error('Add message error:', err);
      throw err;
    }
  }

  async function deleteChat(chatId) {
    try {
      await axios.delete(`/api/chats/${chatId}`);
      sessions.value = sessions.value.filter(s => s._id !== chatId);
      
      if (currentChat.value?._id === chatId) {
        currentChat.value = null;
        messages.value = [];
      }
    } catch (err) {
      console.error('Delete chat error:', err);
      throw err;
    }
  }

  return {
    sessions,
    currentChat,
    messages,
    loading,
    error,
    createSession,
    listSessions,
    loadChat,
    addMessage,
    deleteChat
  };
});
```

---

## RAG Store

### RAG Store Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG Store Schema                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  state       │                                               │
│  │              │                                               │
│  │  documents   │  Array of RAG document objects                │
│  │              │                                               │
│  │  currentDoc  │  Currently selected document                  │
│  │              │                                               │
│  │  queries     │  Array of query results                       │
│  │              │                                               │
│  │  loading     │  Boolean                                     │
│  │              │                                               │
│  │  error       │  Error message                                │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  actions     │                                               │
│  │              │                                               │
│  │  uploadDoc   │  POST /api/rag/documents                      │
│  │              │                                               │
│  │  listDocs    │  GET /api/rag/documents                       │
│  │              │                                               │
│  │  deleteDoc   │  DELETE /api/rag/documents/:id                │
│  │              │                                               │
│  │  search      │  POST /api/rag/search                         │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Other Stores

### Prompt Store

```javascript
// stores/prompt.js
export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function listPrompts() {
    loading.value = true;
    try {
      const response = await axios.get('/api/prompts');
      prompts.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load prompts';
    } finally {
      loading.value = false;
    }
  }

  async function createPrompt(data) {
    loading.value = true;
    try {
      const response = await axios.post('/api/prompts', data);
      prompts.value.push(response.data.data);
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create prompt';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { prompts, loading, error, listPrompts, createPrompt };
});
```

### Tool Store

```javascript
// stores/tool.js
export const useToolStore = defineStore('tool', () => {
  const tools = ref([]);
  const currentTool = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function listTools() {
    try {
      const response = await axios.get('/api/tools');
      tools.value = response.data.data;
    } catch (err) {
      console.error('List tools error:', err);
    }
  }

  async function createTool(data) {
    loading.value = true;
    try {
      const response = await axios.post('/api/tools', data);
      tools.value.push(response.data.data);
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create tool';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function executeTool(toolId, parameters) {
    try {
      const response = await axios.post(`/api/tools/${toolId}/execute`, parameters);
      return response.data.data;
    } catch (err) {
      console.error('Execute tool error:', err);
      throw err;
    }
  }

  return { tools, currentTool, loading, error, listTools, createTool, executeTool };
});
```

### Component Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              Pinia Store Component Lifecycle                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  App Mounts  │                                               │
│  │  (Vue 3)     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Create      │                                               │
│  │  Store       │                                               │
│  │  Instance    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Initialize  │                                               │
│  │  State       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Load Data   │                                               │
│  │  (if needed) │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Store       │                                               │
│  │  Ready       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Component   │                                               │
│  │  Uses Store  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  App Unmounts│                                               │
│  │  (Cleanup)   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

**Lifecycle Stages:**
1. **App Mounts**: Vue 3 creates the app instance
2. **Create Store Instance**: Pinia creates store with defineStore
3. **Initialize State**: Sets initial state values (ref variables)
4. **Load Data (Optional)**: Fetches data on store creation if needed
5. **Store Ready**: Store is available globally
6. **Component Uses Store**: Components access store via useStore()
7. **App Unmounts**: Cleanup happens when app destroys

**Key Points:**
- Stores are created once at app initialization
- State persists across component re-renders
- Actions can be async for API calls
- Cleanup runs on app unmount (for subscriptions, timers, etc.)
```

---

## Store Tags

### Core
- `pinia` - State management
- `state-management` - Pinia stores
- `vue3` - Vue 3 frontend
- `frontend` - Frontend components

### Technical
- `caching` - Response caching strategies
- `streaming` - Response streaming flow
- `pagination` - Data pagination patterns
- `batch-operations` - Bulk user operations
- `query-optimization` - Database query optimization

### Workflow
- `workflows` - Multi-step workflows
- `multi-turn-chat` - Conversation management
- `complete-pipeline` - End-to-end pipeline
- `retry-patterns` - Retry logic and backoff

---

## Related Documentation

- [Frontend Components](./frontend-components.md) - Vue components
- [API Endpoints](../api/api-endpoints.md) - Backend API reference
- [Configuration Guide](../technical/configuration-guide.md) - Environment setup
