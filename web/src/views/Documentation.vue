<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const docs = ref([]);
const selectedDoc = ref(null);
const docContent = ref('');
const loading = ref(true);

const documentationSections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', title: 'Overview', icon: '📖' },
      { id: 'installation', title: 'Installation', icon: '⚙️' },
      { id: 'quick-start', title: 'Quick Start', icon: '🚀' }
    ]
  },
  {
    title: 'API Reference',
    items: [
      { id: 'system-api', title: 'System APIs', icon: '💻' },
      { id: 'llama-api', title: 'Build APIs', icon: '🔨' },
      { id: 'service-api', title: 'Service APIs', icon: '⚙️' },
      { id: 'model-api', title: 'Model APIs', icon: '🤖' }
    ]
  },
  {
    title: 'Build System',
    items: [
      { id: 'build-overview', title: 'Build Overview', icon: '🏗️' },
      { id: 'cpu-build', title: 'CPU Build', icon: '🖥️' },
      { id: 'cuda-build', title: 'CUDA Build', icon: '🎮' },
      { id: 'rocm-build', title: 'ROCm Build', icon: '🔧' }
    ]
  },
  {
    title: 'Services',
    items: [
      { id: 'systemd', title: 'systemd Integration', icon: '🔄' },
      { id: 'auto-update', title: 'Auto-Update', icon: '🔃' },
      { id: 'monitoring', title: 'Monitoring', icon: '📊' }
    ]
  }
];

const documentationContent = {
  'overview': `# LLM Server Overview

Welcome to the LLM Server documentation. This application provides a comprehensive solution for building, managing, and deploying local LLM (Large Language Model) instances using llama.cpp.

## Key Features

- **Automated Build System**: Automatically detects your hardware and builds llama.cpp with optimal settings
- **Hardware Optimization**: Support for CPU (AVX2/AVX512), NVIDIA GPUs (CUDA), and AMD GPUs (ROCm)
- **Service Management**: Integrated systemd service management for easy deployment
- **Model Management**: Download and manage models from HuggingFace
- **System Monitoring**: Real-time system metrics and resource usage
- **Auto-Update**: Automatic monitoring and updating of the llama.cpp repository

## Architecture

The application consists of:
- **Backend**: Node.js/Express.js server with SQLite database
- **Frontend**: Vue.js 3 with Vite
- **Build System**: Bash scripts for automated compilation
- **Service Layer**: systemd integration for production deployment`,

  'installation': `# Installation

## Prerequisites

- Ubuntu 24.04 LTS (recommended)
- Node.js 24.x or later
- Git
- Build tools (cmake, make, gcc/g++)
- For GPU builds: CUDA Toolkit (NVIDIA) or ROCm (AMD)

## Installation Steps

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd llm_server
\`\`\`

2. Install backend dependencies:
\`\`\`bash
npm install
\`\`\`

3. Install frontend dependencies:
\`\`\`bash
cd web
npm install
cd ..
\`\`\`

4. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

5. Configure your settings in .env

6. Initialize the database:
\`\`\`bash
node server/index.js
\`\`\`

The server will automatically create the database and schema on first run.`,

  'quick-start': `# Quick Start Guide

## 1. Start the Server

\`\`\`bash
npm start
\`\`\`

The server will run on http://localhost:3000

## 2. Start the Frontend (Development)

In a separate terminal:
\`\`\`bash
cd web
npm run dev
\`\`\`

The frontend will be available at http://localhost:5173

## 3. Build llama.cpp

1. Navigate to the Build page
2. Select your build type (or use Auto-detect)
3. Click "Clone Repository" if needed
4. Click "Start Build"

The system will automatically detect your hardware and build with optimal settings.

## 4. Manage Services

1. Navigate to the Services page
2. Start/stop services as needed
3. Enable auto-start for production deployment

## 5. Download Models

1. Navigate to the Models page
2. Search for models on HuggingFace
3. Click "Download" for your desired model`,

  'system-api': `# System APIs

## GET /api/system/info

Get detailed system information including CPU, GPU, and memory.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "platform": "linux",
    "cpu": {
      "model": "Intel Core i7",
      "cores": 8,
      "architecture": "x64",
      "features": { "avx2": true, "avx512": false }
    },
    "memory": { "total": 16777216000, "available": 8388608000 },
    "gpu": { "nvidia": { "available": true, "name": "RTX 3080" } },
    "recommendedBuild": "cuda"
  }
}
\`\`\`

## GET /api/system/metrics

Get real-time system metrics.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "cpu": { "usage": 45.2, "cores": 8 },
    "memory": { "total": 16777216000, "used": 8388608000, "free": 8388608000 },
    "uptime": 86400,
    "loadAverage": [1.5, 1.2, 1.0]
  }
}
\`\`\``,

  'llama-api': `# Build APIs

## POST /api/llama/build

Start a new llama.cpp build.

**Request:**
\`\`\`json
{
  "buildType": "auto"  // Options: "auto", "cpu", "cuda", "rocm"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "buildId": "build-1234567890",
    "status": "running"
  }
}
\`\`\`

## GET /api/llama/build/:buildId

Get build output and status.

## GET /api/llama/build/status

Get current build status.

## GET /api/llama/build/history

Get build history.

## POST /api/llama/clone

Clone the llama.cpp repository.`,

  'service-api': `# Service APIs

## GET /api/service/status

Get status of all managed services.

## POST /api/service/:serviceName/start

Start a service.

## POST /api/service/:serviceName/stop

Stop a service.

## POST /api/service/:serviceName/restart

Restart a service.

## POST /api/service/:serviceName/enable

Enable service auto-start.

## POST /api/service/:serviceName/disable

Disable service auto-start.

## GET /api/service/:serviceName/logs

Get service logs (last 50 lines).`,

  'model-api': `# Model APIs

## GET /api/models

Get all local models.

## POST /api/models/search

Search HuggingFace for models.

**Request:**
\`\`\`json
{
  "query": "llama"
}
\`\`\`

## POST /api/models/download

Download a model from HuggingFace.

**Request:**
\`\`\`json
{
  "modelName": "TheBloke/Llama-2-7B-GGUF"
}
\`\`\`

## DELETE /api/models/:modelId

Delete a local model.`,

  'build-overview': `# Build System Overview

The build system automatically compiles llama.cpp with optimal settings for your hardware.

## Build Types

- **auto**: Automatically detects hardware and selects best build type
- **cpu**: CPU-only build with AVX2/AVX512 optimizations
- **cuda**: NVIDIA GPU acceleration
- **rocm**: AMD GPU acceleration

## Build Process

1. Hardware detection
2. Dependency verification
3. CMake configuration
4. Compilation with optimal flags
5. Binary installation

## Build Scripts

- \`clone-llama.sh\`: Clone llama.cpp repository
- \`build-cpu.sh\`: Build with CPU optimizations
- \`build-cuda.sh\`: Build with CUDA support
- \`build-rocm.sh\`: Build with ROCm support
- \`verify-build.sh\`: Verify build success
- \`install-llama.sh\`: Install binaries`,

  'cpu-build': `# CPU Build

Optimized build for CPU-only systems.

## Features Detected

- AVX2 support
- AVX512 support
- Number of cores for parallel compilation

## Build Flags

\`\`\`cmake
-DCMAKE_BUILD_TYPE=Release
-DGGML_NATIVE=ON
-DGGML_AVX2=ON (if supported)
-DGGML_AVX512=ON (if supported)
\`\`\`

## Performance

CPU builds work well for smaller models and systems without GPUs.`,

  'cuda-build': `# CUDA Build

Optimized build for NVIDIA GPUs.

## Requirements

- NVIDIA GPU with CUDA support
- CUDA Toolkit installed
- nvidia-smi available

## Build Flags

\`\`\`cmake
-DCMAKE_BUILD_TYPE=Release
-DGGML_CUDA=ON
-DGGML_NATIVE=ON
\`\`\`

## Environment

Sets \`GGML_CUDA_ENABLE_UNIFIED_MEMORY=1\` for better memory management.`,

  'rocm-build': `# ROCm Build

Optimized build for AMD GPUs.

## Requirements

- AMD GPU with ROCm support
- ROCm toolkit installed
- rocm-smi available

## Build Flags

\`\`\`cmake
-DCMAKE_BUILD_TYPE=Release
-DGGML_ROCM=ON
-DGGML_NATIVE=ON
\`\`\``,

  'systemd': `# systemd Integration

Manage llama-server as a systemd service.

## Service Templates

Located in \`scripts/service/templates/\`

## Installation

Use \`scripts/service/install-service.sh\` to install the systemd service.

## Commands

- Start: \`sudo systemctl start llama-server\`
- Stop: \`sudo systemctl stop llama-server\`
- Restart: \`sudo systemctl restart llama-server\`
- Enable: \`sudo systemctl enable llama-server\`
- Status: \`sudo systemctl status llama-server\`
- Logs: \`sudo journalctl -u llama-server -f\``,

  'auto-update': `# Auto-Update System

Monitors the repository and automatically updates the server.

## Components

- \`monitor-updates.sh\`: Monitors for changes
- \`update-repo.sh\`: Performs updates
- \`check-update.sh\`: Checks for available updates

## Configuration

Set check interval in \`monitor-updates.sh\` (default: 5 minutes)

## Safety Features

- Checks for dependency changes
- Graceful service restart
- Rollback on failure`,

  'monitoring': `# System Monitoring

Real-time monitoring of system resources.

## Metrics Collected

- CPU usage and load average
- Memory usage (total, used, free)
- GPU status and memory (if available)
- System uptime
- Service status

## Update Intervals

- Dashboard: 3 seconds
- Services: 5 seconds
- Build output: 1 second (during builds)

## Alerts

The UI uses color coding:
- Green: Normal (< 50%)
- Yellow: Medium (50-80%)
- Red: High (> 80%)`
};

function selectDoc(docId) {
  selectedDoc.value = docId;
  docContent.value = documentationContent[docId] || '# Documentation Not Found\n\nThis documentation section is not yet available.';
  loading.value = false;
}

onMounted(() => {
  // Select first document by default
  selectDoc('overview');
});
</script>

<template>
  <div class="docs-page">
    <div class="docs-layout">
      <!-- Sidebar Navigation -->
      <aside class="docs-sidebar">
        <div class="docs-sidebar-header">
          <h2>Documentation</h2>
        </div>

        <nav class="docs-nav">
          <div
            v-for="section in documentationSections"
            :key="section.title"
            class="nav-section"
          >
            <h3 class="section-title">{{ section.title }}</h3>
            <div class="section-items">
              <a
                v-for="item in section.items"
                :key="item.id"
                class="nav-link"
                :class="{ active: selectedDoc === item.id }"
                @click.prevent="selectDoc(item.id)"
                href="#"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.title }}</span>
              </a>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Content Area -->
      <main class="docs-content">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading documentation...</p>
        </div>

        <div v-else class="markdown-content" v-html="renderMarkdown(docContent)"></div>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    renderMarkdown(content) {
      // Simple markdown rendering (in production, use a library like marked.js)
      return content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h1><\/p>/g, '</h1>')
        .replace(/<\/h2><\/p>/g, '</h2>')
        .replace(/<\/h3><\/p>/g, '</h3>')
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>');
    }
  }
};
</script>

<style scoped>
.docs-page {
  height: 100%;
  overflow: hidden;
}

.docs-layout {
  display: flex;
  height: 100%;
}

.docs-sidebar {
  width: 280px;
  background: #f8fffe;
  border-right: 2px solid #e5e7eb;
  overflow-y: auto;
  flex-shrink: 0;
}

.docs-sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: linear-gradient(180deg, #d4f4ed 0%, #b8f0e6 100%);
}

.docs-sidebar-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.docs-nav {
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.5rem 1.5rem;
  margin: 0;
}

.section-items {
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  gap: 0.75rem;
}

.nav-link:hover {
  background: rgba(45, 212, 191, 0.1);
  border-left-color: #5dd4bf;
}

.nav-link.active {
  background: rgba(45, 212, 191, 0.15);
  border-left-color: #2dd4bf;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  flex: 1;
}

.docs-content {
  flex: 1;
  overflow-y: auto;
  padding: 3rem;
  background: #ffffff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2dd4bf;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.markdown-content {
  max-width: 900px;
  line-height: 1.7;
}

.markdown-content :deep(h1) {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid #2dd4bf;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
  color: #2c3e50;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  color: #4b5563;
}

.markdown-content :deep(code) {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
  color: #ef4444;
}

.markdown-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #d4d4d4;
  font-size: 0.875rem;
}

.markdown-content :deep(ul) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #2c3e50;
}

.markdown-content :deep(em) {
  font-style: italic;
}
</style>
