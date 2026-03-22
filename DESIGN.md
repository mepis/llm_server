# LLM Server API & Frontend Design Document

**Version:** 1.0  
**Date:** March 22, 2026  
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend API Design](#backend-api-design)
4. [Frontend Design](#frontend-design)
5. [Database & Configuration](#database--configuration)
6. [Security](#security)
7. [Implementation Phases](#implementation-phases)
8. [File Structure](#file-structure)

---

## Overview

### Purpose

This document outlines the design for a web-based management interface for the LLM Server repository. The API and frontend will provide programmatic access to:

- Run shell scripts from the `scripts/` directory
- Create and manage new shell scripts
- Generate systemd service files for running scripts as services
- Retrieve journalctl logs from managed services
- Download models from Hugging Face
- Search for models on Hugging Face

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vue 3 (Composition API, `<script setup>`) |
| Backend | Node.js with Express (CommonJS) |
| Build Tool | Vite (for Vue) |
| HTTP Client | Axios |
| State Management | Pinia (or reactive refs for simpler setup) |
| UI Framework | Tailwind CSS (recommended) or vanilla CSS |
| Runtime | Node.js 18+ |

### Key Design Decisions

1. **Vue 3 Composition API**: Follows 2025-2026 best practices for better code organization and reusability
2. **CommonJS for Backend**: As specified, using `require`/`module.exports` pattern
3. **RESTful API**: Standard REST conventions for all endpoints
4. **Local Configuration**: All configs stored in `~/.llm_server/config.json`
5. **Feature-based Organization**: Backend organized by feature domains

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Components │  │  Composables│  │     Views/Pages     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/Axios
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │  Services   │  │     Controllers     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    System Integration                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Scripts/   │  │  Systemd    │  │   Hugging Face API  │  │
│  │  Directory  │  │  Services   │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User interacts with Vue 3 frontend
2. Frontend makes HTTP requests to Node.js backend
3. Backend routes requests to appropriate controllers
4. Controllers call service layer for business logic
5. Services interact with system (scripts, systemd, Hugging Face API)
6. Results flow back through the stack to the UI

---

## Backend API Design

### Project Structure

```
backend/
├── package.json
├── server.js                    # Entry point
├── config/
│   ├── index.js                 # Configuration loader
│   └── default.json             # Default configuration
├── controllers/
│   ├── scriptController.js
│   ├── serviceController.js
│   └── modelController.js
├── services/
│   ├── scriptService.js
│   ├── systemdService.js
│   ├── journalService.js
│   └── huggingFaceService.js
├── routes/
│   ├── scripts.js
│   ├── services.js
│   └── models.js
├── middleware/
│   ├── errorHandler.js
│   └── logger.js
└── utils/
    ├── shellExecutor.js
    └── fileUtils.js
```

### API Endpoints

#### 1. Scripts Management

**GET `/api/scripts`**
- Description: List all scripts in the scripts directory
- Response: `{ scripts: [{ name, path, description, created, modified }] }`

**POST `/api/scripts`**
- Description: Create a new script
- Body: `{ name, content, description, permissions }`
- Response: `{ success, path, message }`

**GET `/api/scripts/:name`**
- Description: Get script content
- Response: `{ name, content, description, created, modified }`

**PUT `/api/scripts/:name`**
- Description: Update existing script
- Body: `{ content, description }`
- Response: `{ success, message }`

**DELETE `/api/scripts/:name`**
- Description: Delete a script
- Response: `{ success, message }`

**POST `/api/scripts/:name/run`**
- Description: Execute a script
- Query: `{ background }` (optional, default: false)
- Response (foreground): `{ success, output, exitCode }`
- Response (background): `{ success, jobId, message }`

#### 2. Service Management

**GET `/api/services`**
- Description: List all LLM server services
- Response: `{ services: [{ name, status, lastStart, lastStop, script }] }`

**POST `/api/services`**
- Description: Create a new systemd service from a script
- Body: `{ scriptName, serviceName, description, user }`
- Response: `{ success, serviceName, message }`

**DELETE `/api/services/:name`**
- Description: Remove a systemd service
- Response: `{ success, message }`

**POST `/api/services/:name/start`**
- Description: Start a service
- Response: `{ success, message }`

**POST `/api/services/:name/stop`**
- Description: Stop a service
- Response: `{ success, message }`

**POST `/api/services/:name/restart`**
- Description: Restart a service
- Response: `{ success, message }`

#### 3. Journal Logs

**GET `/api/services/:name/logs`**
- Description: Get journalctl logs for a service
- Query Params:
  - `lines` (optional): Number of lines to retrieve (default: 100)
  - `follow` (optional): Stream logs (default: false)
- Response: `{ logs: [string], service: string }`

#### 4. Hugging Face Models

**GET `/api/models/search`**
- Description: Search for models on Hugging Face
- Query Params:
  - `query` (required): Search query
  - `limit` (optional): Max results (default: 20, max: 100)
  - `sort` (optional): Sort field (downloads, likes, created, modified)
  - `order` (optional): Sort order (desc, asc)
- Response: `{ models: [{ id, name, downloads, likes, tags, author }], total }`

**GET `/api/models/:id`**
- Description: Get model details
- Response: `{ id, name, author, downloads, likes, tags, description, files, created, modified }`

**POST `/api/models/download`**
- Description: Download a model from Hugging Face
- Body: `{ modelId, fileName, destination, token }`
- Response: `{ success, jobId, message, progress }`

**GET `/api/models/download/:jobId`**
- Description: Get download progress
- Response: `{ jobId, status, progress, downloaded, total, speed, eta }`

**GET `/api/models/downloads`**
- Description: List all active/pending downloads
- Response: `{ downloads: [{ jobId, modelId, status, progress, created }] }`

### Service Layer Implementation

#### `scriptService.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

class ScriptService {
  constructor() {
    this.scriptsDir = process.env.SCRIPTS_DIR || './scripts';
  }

  async listScripts() {
    const files = await fs.readdir(this.scriptsDir);
    const scripts = await Promise.all(
      files
        .filter(f => f.endsWith('.sh'))
        .map(async (file) => {
          const stat = await fs.stat(path.join(this.scriptsDir, file));
          return {
            name: file,
            path: path.join(this.scriptsDir, file),
            created: stat.birthtime,
            modified: stat.mtime
          };
        })
    );
    return scripts;
  }

  async createScript(name, content, permissions = '755') {
    const filePath = path.join(this.scriptsDir, name);
    await fs.writeFile(filePath, content);
    await fs.chmod(filePath, permissions);
    return filePath;
  }

  async getScript(name) {
    const filePath = path.join(this.scriptsDir, name);
    const content = await fs.readFile(filePath, 'utf-8');
    const stat = await fs.stat(filePath);
    return {
      name,
      content,
      created: stat.birthtime,
      modified: stat.mtime
    };
  }

  async updateScript(name, content) {
    const filePath = path.join(this.scriptsDir, name);
    await fs.writeFile(filePath, content);
  }

  async deleteScript(name) {
    const filePath = path.join(this.scriptsDir, name);
    await fs.unlink(filePath);
  }

  async runScript(name, background = false) {
    const filePath = path.join(this.scriptsDir, name);
    return new Promise((resolve, reject) => {
      const options = background ? { detached: true } : {};
      const child = exec(`"${filePath}"`, options, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stdout, stderr });
          return;
        }
        resolve({
          success: true,
          output: stdout || stderr,
          exitCode: 0
        });
      });
      if (background) {
        child.unref();
        resolve({
          success: true,
          jobId: child.pid,
          message: `Script running in background (PID: ${child.pid})`
        });
      }
    });
  }
}

module.exports = new ScriptService();
```

#### `systemdService.js`

```javascript
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SystemdService {
  constructor() {
    this.servicesDir = process.env.SERVICES_DIR || './integrations/linux/services';
  }

  async createService(scriptName, serviceName, description = '', user = 'root') {
    const scriptPath = path.join(process.env.SCRIPTS_DIR || './scripts', scriptName);
    
    const serviceContent = `[Unit]
Description=${description || 'LLM Server Service'}
After=network.target

[Service]
Type=simple
WorkingDirectory=%h
ExecStart=${scriptPath}
Restart=on-failure
RestartSec=5
User=${user}

[Install]
WantedBy=default.target
`;

    const serviceFile = path.join(this.servicesDir, `${serviceName}.service`);
    await fs.writeFile(serviceFile, serviceContent);

    // Reload systemd and enable service
    await this._execSystemctl('daemon-reload');
    await this._execSystemctl(`enable ${serviceName}`);
    await this._execSystemctl(`start ${serviceName}`);

    return serviceName;
  }

  async removeService(serviceName) {
    await this._execSystemctl(`stop ${serviceName}`);
    await this._execSystemctl(`disable ${serviceName}`);
    
    const serviceFile = path.join(this.servicesDir, `${serviceName}.service`);
    try {
      await fs.unlink(serviceFile);
    } catch (e) {
      // Service file might not exist
    }

    await this._execSystemctl('daemon-reload');
  }

  async getServiceStatus(serviceName) {
    const result = await this._execSystemctl(`status ${serviceName} --no-pager`);
    return {
      name: serviceName,
      status: result.includes('active (running)') ? 'running' : 'stopped'
    };
  }

  async listServices() {
    const result = await this._execSystemctl('list-units --type=service --no-pager');
    // Parse output to extract LLM-related services
    const services = [];
    const lines = result.split('\n');
    lines.forEach(line => {
      if (line.includes('llama') || line.includes('llm')) {
        const parts = line.split(/\s+/);
        services.push({
          name: parts[2]?.replace('.service', ''),
          status: parts[3],
          loaded: parts[4]
        });
      }
    });
    return services;
  }

  async _execSystemctl(command) {
    return new Promise((resolve, reject) => {
      exec(`sudo ${command}`, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}

module.exports = new SystemdService();
```

#### `journalService.js`

```javascript
const { exec } = require('child_process');

class JournalService {
  async getLogs(serviceName, lines = 100) {
    return new Promise((resolve, reject) => {
      const cmd = `sudo journalctl -u ${serviceName} -n ${lines} --no-pager`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stderr });
          return;
        }
        const logs = stdout.trim().split('\n');
        resolve({ logs, service: serviceName });
      });
    });
  }

  async getLogsStream(serviceName) {
    // Returns a readable stream of logs
    const child = exec(`sudo journalctl -u ${serviceName} -f --no-pager`);
    const logs = [];
    
    child.stdout.on('data', (data) => {
      logs.push(data.toString());
    });

    return {
      stream: child.stdout,
      logs: () => logs
    };
  }
}

module.exports = new JournalService();
```

#### `huggingFaceService.js`

```javascript
const { exec } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs').promises;

class HuggingFaceService {
  constructor() {
    this.downloadDir = process.env.MODEL_DIR || '~/.llm_server/models';
  }

  async searchModels(query, limit = 20, sort = 'downloads', order = 'desc') {
    const url = new URL('https://huggingface.co/api/models');
    url.searchParams.set('search', query);
    url.searchParams.set('limit', Math.min(limit, 100).toString());
    url.searchParams.set('sort', sort);
    url.searchParams.set('direction', order);

    return new Promise((resolve, reject) => {
      https.get(url.toString(), (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const models = JSON.parse(data);
            resolve(models.map(m => ({
              id: m.modelId,
              name: m.name || m.modelId.split('/')[1],
              author: m.author,
              downloads: m.downloads || 0,
              likes: m.likes || 0,
              tags: m.tags || [],
              description: m.description || ''
            })));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async getModelDetails(modelId) {
    const url = `https://huggingface.co/api/models/${modelId}`;
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const model = JSON.parse(data);
            resolve({
              id: model.modelId,
              name: model.name || model.modelId.split('/')[1],
              author: model.author,
              downloads: model.downloads || 0,
              likes: model.likes || 0,
              tags: model.tags || [],
              description: model.description || '',
              files: model.private ? [] : model.siblings?.map(f => f.rfilename) || [],
              created: model.created_at,
              modified: model.lastModified
            });
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async downloadModel(modelId, fileName = null, destination = null, token = null) {
    const dest = destination || this.downloadDir;
    await fs.mkdir(dest, { recursive: true });

    let command = `hf download ${modelId}`;
    if (fileName) {
      command += ` ${fileName}`;
    }
    if (dest) {
      command += ` --local-dir ${dest}`;
    }
    if (token) {
      command += ` --token ${token}`;
    }

    return new Promise((resolve, reject) => {
      const child = exec(command, { maxBuffer: 1024 * 1024 * 10 });
      const result = {
        jobId: Date.now().toString(),
        status: 'running',
        progress: 0,
        downloaded: 0,
        total: 0,
        speed: 0,
        eta: null
      };

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        // Parse progress from output
        const progressMatch = data.toString().match(/(\d+)%/);
        if (progressMatch) {
          result.progress = parseInt(progressMatch[1]);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          result.status = 'completed';
          resolve({
            success: true,
            jobId: result.jobId,
            path: dest,
            message: 'Download completed successfully'
          });
        } else {
          result.status = 'failed';
          reject({ error: `Download failed with code ${code}`, output });
        }
      });

      child.on('error', reject);
    });
  }
}

module.exports = new HuggingFaceService();
```

### Controller Layer

#### `scriptController.js`

```javascript
const scriptService = require('../services/scriptService');

class ScriptController {
  async listScripts(req, res) {
    try {
      const scripts = await scriptService.listScripts();
      res.json({ scripts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getScript(req, res) {
    try {
      const { name } = req.params;
      const script = await scriptService.getScript(name);
      res.json(script);
    } catch (error) {
      res.status(404).json({ error: 'Script not found' });
    }
  }

  async createScript(req, res) {
    try {
      const { name, content, description, permissions } = req.body;
      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
      }
      const path = await scriptService.createScript(name, content, permissions);
      res.json({ success: true, path, message: 'Script created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateScript(req, res) {
    try {
      const { name } = req.params;
      const { content, description } = req.body;
      await scriptService.updateScript(name, content);
      res.json({ success: true, message: 'Script updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteScript(req, res) {
    try {
      const { name } = req.params;
      await scriptService.deleteScript(name);
      res.json({ success: true, message: 'Script deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async runScript(req, res) {
    try {
      const { name } = req.params;
      const { background } = req.query;
      const result = await scriptService.runScript(name, background === 'true');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ScriptController();
```

---

## Frontend Design

### Project Structure

```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── api/
│   │   └── client.js           # Axios instance with interceptors
│   ├── views/
│   │   ├── ScriptsView.vue
│   │   ├── ServicesView.vue
│   │   ├── ModelsView.vue
│   │   └── DownloadView.vue
│   ├── components/
│   │   ├── ScriptEditor.vue
│   │   ├── ServiceCard.vue
│   │   ├── ModelCard.vue
│   │   ├── LogViewer.vue
│   │   └── DownloadProgress.vue
│   ├── composables/
│   │   ├── useScripts.js
│   │   ├── useServices.js
│   │   ├── useModels.js
│   │   └── useLogs.js
│   ├── stores/
│   │   └── downloadStore.js    # Pinia store for downloads
│   └── styles/
│       └── main.css
```

### Key Components

#### `useScripts.js` Composable

```javascript
import { ref, reactive } from 'vue';
import api from '../api/client';

export function useScripts() {
  const scripts = ref([]);
  const currentScript = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const listScripts = async () => {
    loading.value = true;
    try {
      const response = await api.get('/scripts');
      scripts.value = response.data.scripts;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load scripts';
    } finally {
      loading.value = false;
    }
  };

  const getScript = async (name) => {
    loading.value = true;
    try {
      const response = await api.get(`/scripts/${name}`);
      currentScript.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load script';
    } finally {
      loading.value = false;
    }
  };

  const createScript = async (scriptData) => {
    try {
      const response = await api.post('/scripts', scriptData);
      await listScripts();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create script';
      throw err;
    }
  };

  const updateScript = async (name, scriptData) => {
    try {
      await api.put(`/scripts/${name}`, scriptData);
      await getScript(name);
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update script';
      throw err;
    }
  };

  const deleteScript = async (name) => {
    try {
      await api.delete(`/scripts/${name}`);
      scripts.value = scripts.value.filter(s => s.name !== name);
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete script';
      throw err;
    }
  };

  const runScript = async (name, background = false) => {
    try {
      const response = await api.post(`/scripts/${name}/run?background=${background}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to run script';
      throw err;
    }
  };

  return {
    scripts,
    currentScript,
    loading,
    error,
    listScripts,
    getScript,
    createScript,
    updateScript,
    deleteScript,
    runScript
  };
}
```

#### `ScriptsView.vue`

```vue
<script setup>
import { onMounted } from 'vue';
import { useScripts } from '../composables/useScripts';
import ScriptEditor from '../components/ScriptEditor.vue';

const {
  scripts,
  currentScript,
  loading,
  error,
  listScripts,
  getScript,
  createScript,
  updateScript,
  deleteScript,
  runScript
} = useScripts();

const showEditor = ref(false);
const editingScript = ref(null);

onMounted(() => {
  listScripts();
});

const handleEdit = async (script) => {
  editingScript.value = script;
  await getScript(script.name);
  showEditor.value = true;
};

const handleCreate = () => {
  editingScript.value = null;
  currentScript.value = { content: '#!/bin/bash\n\n' };
  showEditor.value = true;
};

const handleSave = async (data) => {
  try {
    if (editingScript.value) {
      await updateScript(editingScript.value.name, data);
    } else {
      await createScript(data);
    }
    showEditor.value = false;
    listScripts();
  } catch (err) {
    console.error('Failed to save script:', err);
  }
};

const handleDelete = async (name) => {
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    try {
      await deleteScript(name);
    } catch (err) {
      console.error('Failed to delete script:', err);
    }
  }
};

const handleRun = async (name) => {
  try {
    const result = await runScript(name);
    console.log('Script output:', result.output);
  } catch (err) {
    console.error('Failed to run script:', err);
  }
};
</script>

<template>
  <div class="scripts-view">
    <div class="header">
      <h1>Scripts</h1>
      <button @click="handleCreate" class="btn-primary">
        + New Script
      </button>
    </div>

    <div v-if="loading" class="loading">Loading scripts...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="script-list">
      <div
        v-for="script in scripts"
        :key="script.name"
        class="script-item"
      >
        <div class="script-info">
          <h3>{{ script.name }}</h3>
          <p class="meta">
            Modified: {{ new Date(script.modified).toLocaleString() }}
          </p>
        </div>
        <div class="script-actions">
          <button @click="handleEdit(script)" class="btn-secondary">
            Edit
          </button>
          <button @click="handleRun(script.name)" class="btn-success">
            Run
          </button>
          <button @click="handleDelete(script.name)" class="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>

    <ScriptEditor
      v-if="showEditor"
      :script="currentScript"
      :editing="!!editingScript"
      @save="handleSave"
      @cancel="showEditor = false"
    />
  </div>
</template>

<style scoped>
.scripts-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.script-list {
  display: grid;
  gap: 1rem;
}

.script-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.script-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-success,
.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}
</style>
```

#### `useModels.js` Composable

```javascript
import { ref } from 'vue';
import api from '../api/client';

export function useModels() {
  const searchResults = ref([]);
  const currentModel = ref(null);
  const downloads = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const searchModels = async (query, limit = 20) => {
    loading.value = true;
    try {
      const response = await api.get('/models/search', {
        params: { query, limit }
      });
      searchResults.value = response.data.models;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to search models';
    } finally {
      loading.value = false;
    }
  };

  const getModelDetails = async (modelId) => {
    try {
      const response = await api.get(`/models/${modelId}`);
      currentModel.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load model details';
      throw err;
    }
  };

  const downloadModel = async (modelId, fileName = null) => {
    try {
      const response = await api.post('/models/download', {
        modelId,
        fileName
      });
      await listDownloads();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start download';
      throw err;
    }
  };

  const listDownloads = async () => {
    try {
      const response = await api.get('/models/downloads');
      downloads.value = response.data.downloads;
    } catch (err) {
      console.error('Failed to list downloads:', err);
    }
  };

  return {
    searchResults,
    currentModel,
    downloads,
    loading,
    error,
    searchModels,
    getModelDetails,
    downloadModel,
    listDownloads
  };
}
```

### State Management (Pinia Store)

#### `downloadStore.js`

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client';

export const useDownloadStore = defineStore('downloads', () => {
  const activeDownloads = ref([]);
  const completedDownloads = ref([]);
  const failedDownloads = ref([]);

  const allDownloads = computed(() => [
    ...activeDownloads.value,
    ...completedDownloads.value,
    ...failedDownloads.value
  ]);

  const addDownload = (download) => {
    activeDownloads.value.push(download);
  };

  const updateDownload = (jobId, updates) => {
    const index = activeDownloads.value.findIndex(d => d.jobId === jobId);
    if (index !== -1) {
      activeDownloads.value[index] = {
        ...activeDownloads.value[index],
        ...updates
      };

      if (updates.status === 'completed') {
        completedDownloads.value.unshift(
          activeDownloads.value.splice(index, 1)[0]
        );
      } else if (updates.status === 'failed') {
        failedDownloads.value.unshift(
          activeDownloads.value.splice(index, 1)[0]
        );
      }
    }
  };

  const removeDownload = (jobId) => {
    activeDownloads.value = activeDownloads.value.filter(d => d.jobId !== jobId);
    completedDownloads.value = completedDownloads.value.filter(d => d.jobId !== jobId);
    failedDownloads.value = failedDownloads.value.filter(d => d.jobId !== jobId);
  };

  const pollDownloads = async () => {
    try {
      const response = await api.get('/models/downloads');
      response.data.downloads.forEach(download => {
        const existing = activeDownloads.value.find(d => d.jobId === download.jobId);
        if (existing) {
          updateDownload(download.jobId, {
            progress: download.progress,
            status: download.status
          });
        }
      });
    } catch (err) {
      console.error('Failed to poll downloads:', err);
    }
  };

  return {
    activeDownloads,
    completedDownloads,
    failedDownloads,
    allDownloads,
    addDownload,
    updateDownload,
    removeDownload,
    pollDownloads
  };
});
```

---

## Database & Configuration

### Configuration File

**`~/.llm_server/config.json`**

```json
{
  "llmServerHome": "/home/jon/.llm_server",
  "scriptsDir": "/home/jon/.llm_server/scripts",
  "servicesDir": "/home/jon/.llm_server/integrations/linux/services",
  "modelDir": "/home/jon/.llm_server/models",
  "logsDir": "/home/jon/.llm_server/logs",
  "huggingface": {
    "token": null,
    "cacheDir": "~/.cache/huggingface"
  },
  "server": {
    "port": 3000,
    "host": "127.0.0.1"
  }
}
```

### Configuration Loader

**`config/index.js`**

```javascript
const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(process.env.HOME, '.llm_server', 'config.json');

let config = null;

async function loadConfig() {
  if (config) return config;

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(data);
  } catch (error) {
    // Use defaults if config doesn't exist
    config = {
      llmServerHome: path.join(process.env.HOME, '.llm_server'),
      scriptsDir: path.join(process.env.HOME, '.llm_server', 'scripts'),
      servicesDir: path.join(process.env.HOME, '.llm_server', 'integrations', 'linux', 'services'),
      modelDir: path.join(process.env.HOME, '.llm_server', 'models'),
      logsDir: path.join(process.env.HOME, '.llm_server', 'logs'),
      huggingface: {
        token: null,
        cacheDir: path.join(process.env.HOME, '.cache', 'huggingface')
      },
      server: {
        port: 3000,
        host: '127.0.0.1'
      }
    };
    await saveConfig(config);
  }

  return config;
}

async function saveConfig(newConfig) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

module.exports = {
  loadConfig,
  saveConfig
};
```

---

## Security

### Authentication

For local use, implement API key authentication:

```javascript
// middleware/auth.js
const auth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const config = require('../config');
  
  if (apiKey === config.apiKey) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;
```

### Environment Variables

Store sensitive data in environment variables:

```javascript
// server.js
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-secret-key';
```

### Input Validation

Validate all user inputs:

```javascript
// utils/validator.js
const validateScriptName = (name) => {
  const regex = /^[a-zA-Z0-9_-]+\.sh$/;
  if (!regex.test(name)) {
    throw new Error('Invalid script name');
  }
};

const validateModelId = (id) => {
  const regex = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
  if (!regex.test(id)) {
    throw new Error('Invalid model ID');
  }
};

module.exports = {
  validateScriptName,
  validateModelId
};
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

1. **Backend Setup**
   - Initialize Express server
   - Set up project structure
   - Implement configuration loader
   - Create shell executor utility

2. **Scripts API**
   - Implement script CRUD operations
   - Implement script execution
   - Add file permission handling

3. **Frontend Setup**
   - Initialize Vue 3 project with Vite
   - Set up routing (Vue Router)
   - Create basic layout and navigation
   - Implement ScriptsView component

### Phase 2: Services (Week 2)

1. **Systemd Integration**
   - Implement service creation from scripts
   - Add service status management
   - Implement service start/stop/restart

2. **Journal Logs**
   - Implement log retrieval
   - Add log streaming capability
   - Create LogViewer component

3. **Services Frontend**
   - Create ServicesView
   - Implement ServiceCard component
   - Add service management actions

### Phase 3: Model Management (Week 3)

1. **Hugging Face Integration**
   - Implement model search
   - Add model details retrieval
   - Implement model download with progress tracking

2. **Download Management**
   - Create download queue system
   - Implement progress tracking
   - Add download history

3. **Models Frontend**
   - Create ModelsView with search
   - Implement ModelCard component
   - Add DownloadProgress component
   - Create download manager view

### Phase 4: Polish & Security (Week 4)

1. **Security Implementation**
   - Add API key authentication
   - Implement input validation
   - Add rate limiting

2. **UI/UX Improvements**
   - Add error handling
   - Implement loading states
   - Add notifications/toast messages
   - Improve responsive design

3. **Testing & Documentation**
   - Write API documentation
   - Create user guide
   - Add README files

---

## File Structure

### Complete Repository Structure

```
llm_server/
├── scripts/                          # Existing shell scripts
│   ├── init.sh
│   ├── build.sh
│   ├── run.sh
│   ├── run_qwen3.5-35-q8.sh
│   └── ...
├── integrations/
│   ├── linux/
│   │   └── services/                 # Existing systemd services
│   │       └── llama.service
│   └── opencode/
├── backend/                          # NEW: Node.js API
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   ├── index.js
│   │   └── default.json
│   ├── controllers/
│   │   ├── scriptController.js
│   │   ├── serviceController.js
│   │   └── modelController.js
│   ├── services/
│   │   ├── scriptService.js
│   │   ├── systemdService.js
│   │   ├── journalService.js
│   │   └── huggingFaceService.js
│   ├── routes/
│   │   ├── scripts.js
│   │   ├── services.js
│   │   └── models.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── auth.js
│   └── utils/
│       ├── shellExecutor.js
│       └── fileUtils.js
├── frontend/                         # NEW: Vue 3 Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── api/
│       │   └── client.js
│       ├── views/
│       │   ├── ScriptsView.vue
│       │   ├── ServicesView.vue
│       │   ├── ModelsView.vue
│       │   └── DownloadView.vue
│       ├── components/
│       │   ├── ScriptEditor.vue
│       │   ├── ServiceCard.vue
│       │   ├── ModelCard.vue
│       │   ├── LogViewer.vue
│       │   └── DownloadProgress.vue
│       ├── composables/
│       │   ├── useScripts.js
│       │   ├── useServices.js
│       │   ├── useModels.js
│       │   └── useLogs.js
│       ├── stores/
│       │   └── downloadStore.js
│       └── styles/
│           └── main.css
├── config/
│   └── config.json                   # User configuration (~/.llm_server/)
├── logs/
│   └── api.log                       # API logs
├── .env.example                      # Environment variables template
├── README.md
└── API.md                            # API documentation
```

### Package.json Files

**`backend/package.json`**

```json
{
  "name": "llm-server-backend",
  "version": "1.0.0",
  "description": "Backend API for LLM Server management",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**`frontend/package.json`**

```json
{
  "name": "llm-server-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "axios": "^1.6.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.20.1"
  }
}
```

---

## Summary

This design document provides a comprehensive blueprint for building a Vue 3 frontend and Node.js backend API for managing the LLM Server repository. The architecture follows modern best practices:

- **Separation of Concerns**: Clear separation between routes, controllers, and services
- **Composition API**: Vue 3 Composition API for better code organization
- **CommonJS Backend**: As requested, using require/module.exports
- **RESTful Design**: Standard REST API conventions
- **Local Configuration**: User configs stored in `~/.llm_server/config.json`
- **Scalable Structure**: Feature-based organization for easy maintenance

The implementation is broken into 4 phases, allowing for incremental development and testing. Each phase builds upon the previous one, ensuring a stable foundation before adding new features.
