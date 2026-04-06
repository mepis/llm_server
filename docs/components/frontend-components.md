# Frontend Components

This document covers the frontend component architecture in LLM Server, built with Vue 3, Vue Router, Pinia, and PrimeVue.

---

## Overview

The frontend is a Vue 3 Single Page Application (SPA) that provides a user-friendly interface for interacting with the LLM Server backend. Key capabilities include:

- Authentication pages (login, register)
- Chat interface with streaming
- Document management for RAG
- Prompt and tool management
- System monitoring dashboard
- Responsive design with Tailwind CSS

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  HTML        │                                               │
│  │  Templates   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Vue 3       │                                               │
│  │  Components  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Pinia       │                                               │
│  │  Stores      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Vue Router │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Axios       │                                               │
│  │  HTTP        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  API         │                                               │
│  │  Server      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### Directory Structure

```
frontend/src/
├── components/           # Reusable components
│   ├── auth/            # Authentication components
│   │   └── LoginKeypad.vue
│   ├── layout/          # Layout components
│   │   ├── Header.vue
│   │   └── Sidebar.vue
│   └── HelloWorld.vue
│
├── stores/              # Pinia state management
│   ├── auth.js
│   ├── chat.js
│   ├── llama.js
│   ├── rag.js
│   ├── prompt.js
│   ├── tool.js
│   ├── user.js
│   └── matrix.js
│
├── views/               # Page components
│   ├── HomeView.vue
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   ├── ChatView.vue
│   ├── ChatHistoryView.vue
│   ├── RAGDocumentsView.vue
│   ├── RAGQueriesView.vue
│   ├── PromptsView.vue
│   ├── ToolsView.vue
│   ├── LogsView.vue
│   └── SystemMonitorView.vue
│
├── router/              # Vue Router configuration
│   └── index.js
│
├── App.vue              # Root component
├── main.js              # Application entry point
└── style.css            # Global styles
```

---

## Layout Components

### Header Component

```
┌─────────────────────────────────────────────────────────────────┐
│                    Header Component                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Logo        │  Application logo                            │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Navigation  │  Main navigation links                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  User Menu   │  User profile dropdown                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Logout      │  Logout button                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sidebar Component

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sidebar Component                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Chat        │  Chat interface                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  RAG         │  RAG documents                                │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Prompts     │  Prompt templates                             │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Tools       │  Custom tools                                 │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Logs        │  System logs                                  │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Monitor     │  System monitoring                            │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Components

### Login View

```
┌─────────────────────────────────────────────────────────────────┐
│                    Login View                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Username    │  Username input field                         │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Password    │  Password input field                        │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Login       │  Login button                                │
│  │  button      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Register    │  Link to registration page                   │
│  │  link        │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Register View

```
┌─────────────────────────────────────────────────────────────────┐
│                    Register View                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Username    │  Username input field                         │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Email       │  Email input field                            │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Password    │  Password input field                         │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Confirm     │  Confirm password input                       │
│  │  Password    │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Register    │  Register button                              │
│  │  button      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Components

### Chat View

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chat View                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Message     │  Message history scroll area                  │
│  │  history     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Loading     │  Loading indicator for streaming             │
│  │  indicator   │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Input       │  Text input for user messages                │
│  │  area        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Send        │  Send button                                  │
│  │  button      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Chat History View

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chat History View                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  New Chat    │  Create new chat button                        │
│  │  button      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Session     │  List of chat sessions                        │
│  │  list        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Preview     │  Message preview for each session            │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## RAG Components

### RAG Documents View

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG Documents View                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Upload      │  File upload area                             │
│  │  area        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Document    │  List of uploaded documents                   │
│  │  list        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Status      │  Processing status indicators                │
│  │  indicators  │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### RAG Queries View

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG Queries View                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Search      │  Search input field                           │
│  │  input       │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Results     │  Search results display                      │
│  │  display     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Score       │  Relevance scores for each result            │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Tags

- `vue3` - Vue 3 frontend
- `frontend` - Frontend components
- `pinia` - State management
- `chat` - Chat session management

---

## Related Documentation

- [Pinia Stores](./pinia-stores.md) - State management
- [API Endpoints](../api/api-endpoints.md) - Backend API reference
- [Configuration Guide](../technical/configuration-guide.md) - Environment setup
