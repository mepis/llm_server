# LLM Server Development Plan

**Project:** Local LLM Management System with Vue.js Frontend
**Created:** 2026-02-22
**Creative Liberty Level:** 5/10
**Last Updated:** 2026-02-22

## Executive Summary

This project builds a comprehensive local LLM management system that automates the installation, configuration, and operation of llama.cpp with a Vue.js-based web interface. The system will handle hardware detection, optimized builds, model management from HuggingFace, system monitoring, and service management.

## Technology Stack

- **Backend:** Node.js with Express.js
- **Frontend:** Vue.js (Single Page Application)
- **Database:** SQLite
- **Web Server:** Express.js
- **Target OS:** Ubuntu 24
- **Hosting:** Self-hosted
- **Config Management:** .env file + SQLite database

## Development Phases

---

### Phase 1: Planning and Architecture (CURRENT PHASE)

**Status:** In Progress
**Goal:** Create comprehensive project plan and architecture documentation

#### Todo List:
- [x] Read and analyze instructions
- [x] Research llama.cpp build documentation
- [x] Research AGENTS.md format
- [ ] Create detailed development plan document
- [ ] Identify technical requirements and dependencies
- [ ] Design database schema for config storage
- [ ] Design API endpoints structure
- [ ] Design frontend component architecture
- [ ] Review plan for gaps and issues
- [ ] Finalize development plan

---

### Phase 2: Project Preparation and Setup

**Status:** Pending
**Goal:** Set up project structure, documentation, and development environment

#### Todo List:
- [ ] Create AGENTS.md file with project directives
- [ ] Create logs folder structure (progress, change_logs)
- [ ] Create progress_index.md in logs folder
- [ ] Create changelog_index.md in change_logs folder
- [ ] Create docs folder structure
- [ ] Create docs/index.md file
- [ ] Initialize Node.js project (package.json)
- [ ] Set up basic project folder structure
- [ ] Create .gitignore file
- [ ] Initial git commit of project structure

---

### Phase 3: Core Infrastructure Development

**Status:** Pending
**Goal:** Build foundational backend infrastructure

#### Todo List:
- [ ] Set up SQLite database connection module
- [ ] Design and implement database schema for configs
- [ ] Create database migration/initialization script
- [ ] Set up Express.js server with basic routing
- [ ] Create .env configuration loader
- [ ] Implement error handling middleware
- [ ] Create logging utility module
- [ ] Create basic health check endpoint
- [ ] Test database operations
- [ ] Commit: Core infrastructure setup

---

### Phase 4: System Detection and Hardware Analysis

**Status:** Pending
**Goal:** Implement hardware detection for optimization

#### Todo List:
- [ ] Create CPU detection module (cores, architecture)
- [ ] Create GPU detection module (NVIDIA/AMD/none)
- [ ] Create memory detection module
- [ ] Create CUDA/ROCm detection utility
- [ ] Create system capabilities summary endpoint
- [ ] Implement hardware detection API endpoints
- [ ] Test on system without GPU
- [ ] Test on system with NVIDIA GPU (if available)
- [ ] Document hardware detection capabilities
- [ ] Commit: Hardware detection implementation

---

### Phase 5: Llama.cpp Build Scripts

**Status:** Pending
**Goal:** Create automated llama.cpp build system

#### Todo List:
- [ ] Create script to clone llama.cpp repository
- [ ] Create hardware-optimized CMake configuration generator
- [ ] Create build script for CPU-only systems
- [ ] Create build script for NVIDIA GPU systems (CUDA)
- [ ] Create build script for AMD GPU systems (ROCm)
- [ ] Add build progress tracking and logging
- [ ] Create dependency installation script for Ubuntu 24
- [ ] Implement build status API endpoint
- [ ] Test build process on current system
- [ ] Document build scripts and options
- [ ] Commit: Llama.cpp build automation

---

### Phase 6: Llama.cpp Service Management

**Status:** Pending
**Goal:** Create systemd service and launch scripts

#### Todo List:
- [ ] Create optimized llama-server launch script
- [ ] Implement unified memory support for NVIDIA GPUs
- [ ] Create configuration template for llama-server
- [ ] Create systemd service file for llama-server
- [ ] Create service installation script (requires root)
- [ ] Create service start/stop/restart API endpoints
- [ ] Implement service status monitoring
- [ ] Test service installation and management
- [ ] Document service configuration options
- [ ] Commit: Llama.cpp service management

---

### Phase 7: Frontend Foundation (Vue.js)

**Status:** Pending
**Goal:** Set up Vue.js application with routing and theme

#### Todo List:
- [ ] Initialize Vue.js project with Vite
- [ ] Set up Vue Router for navigation
- [ ] Create mint and white theme (CSS variables)
- [ ] Create main layout component with sidebar
- [ ] Create sidebar navigation component
- [ ] Set up state management (Pinia or Vuex)
- [ ] Create API client service
- [ ] Configure frontend build process
- [ ] Test basic routing and layout
- [ ] Commit: Vue.js frontend foundation

---

### Phase 8: System Monitoring Dashboard

**Status:** Pending
**Goal:** Implement real-time system metrics display

#### Todo List:
- [ ] Create backend system metrics API (CPU, memory, GPU)
- [ ] Implement real-time metrics updates (polling or WebSocket)
- [ ] Create system metrics display component
- [ ] Create CPU usage gauge/chart
- [ ] Create memory usage gauge/chart
- [ ] Create GPU usage gauge/chart (if available)
- [ ] Create disk usage display
- [ ] Add auto-refresh functionality
- [ ] Test metrics accuracy and performance
- [ ] Commit: System monitoring dashboard

---

### Phase 9: Script Management Interface

**Status:** Pending
**Goal:** Create UI for running build and management scripts

#### Todo List:
- [ ] Create script execution API endpoints
- [ ] Implement script output streaming
- [ ] Create script execution component
- [ ] Create build llama.cpp interface
- [ ] Create service management interface
- [ ] Add script execution logging
- [ ] Implement progress indicators
- [ ] Add error handling and user feedback
- [ ] Test script execution and monitoring
- [ ] Commit: Script management interface

---

### Phase 10: HuggingFace Model Management

**Status:** Pending
**Goal:** Implement model search, download, and management

#### Todo List:
- [ ] Research HuggingFace API for model search
- [ ] Create HuggingFace search API integration
- [ ] Create model download script (using huggingface-cli or curl)
- [ ] Implement download progress tracking
- [ ] Create model storage directory management
- [ ] Create model search interface component
- [ ] Create model download interface
- [ ] Create model list/management interface
- [ ] Add model metadata storage in SQLite
- [ ] Test model search and download
- [ ] Commit: HuggingFace model management

---

### Phase 11: Documentation Integration

**Status:** Pending
**Goal:** Integrate documentation into frontend

#### Todo List:
- [ ] Create documentation reader component
- [ ] Create documentation navigation sidebar
- [ ] Implement markdown rendering in frontend
- [ ] Create documentation API endpoint
- [ ] Add documentation for installation process
- [ ] Add documentation for configuration options
- [ ] Add documentation for model management
- [ ] Add documentation for troubleshooting
- [ ] Create docs/index.md with comprehensive links
- [ ] Commit: Documentation integration

---

### Phase 12: Auto-Update System

**Status:** Pending
**Goal:** Implement repository monitoring and auto-update

#### Todo List:
- [ ] Create git repository monitoring service
- [ ] Implement automatic git pull on new commits
- [ ] Create dependency update detection
- [ ] Implement automatic npm install on package.json changes
- [ ] Create service restart mechanism
- [ ] Create .env file update handler
- [ ] Create systemd service for update monitor
- [ ] Add update notification system
- [ ] Test update detection and execution
- [ ] Commit: Auto-update system

---

### Phase 13: Frontend Service Management

**Status:** Pending
**Goal:** Create systemd service for frontend

#### Todo List:
- [ ] Create frontend build script
- [ ] Create Express.js static file server for production
- [ ] Create systemd service file for frontend
- [ ] Create frontend service installation script
- [ ] Configure network accessibility
- [ ] Implement CORS configuration
- [ ] Test frontend service on system startup
- [ ] Test network accessibility from other devices
- [ ] Document frontend deployment
- [ ] Commit: Frontend service management

---

### Phase 14: Repository Update Script

**Status:** Pending
**Goal:** Create manual update and build script

#### Todo List:
- [ ] Create update script (git pull)
- [ ] Add dependency installation to update script
- [ ] Add frontend build to update script
- [ ] Add service restart to update script
- [ ] Add error handling and rollback capability
- [ ] Create UI button for manual updates
- [ ] Test update script execution
- [ ] Document update process
- [ ] Commit: Repository update script

---

### Phase 15: Integration Testing and Bug Fixes

**Status:** Pending
**Goal:** End-to-end testing and issue resolution

#### Todo List:
- [ ] Test complete workflow: install → build → configure → run
- [ ] Test hardware detection on different systems
- [ ] Test model download and management
- [ ] Test service installation and startup
- [ ] Test frontend accessibility over network
- [ ] Test auto-update system
- [ ] Create bug list from testing
- [ ] Prioritize and fix critical bugs
- [ ] Retest after bug fixes
- [ ] Commit: Integration testing and fixes

---

### Phase 16: Unit Tests and Automated Testing

**Status:** Pending
**Goal:** Implement comprehensive test coverage

#### Todo List:
- [ ] Set up testing framework (Jest/Mocha for Node.js)
- [ ] Create unit tests for database operations
- [ ] Create unit tests for hardware detection
- [ ] Create unit tests for build script generation
- [ ] Create unit tests for API endpoints
- [ ] Create frontend component tests (Vitest)
- [ ] Create integration tests for critical workflows
- [ ] Create automated test runner script
- [ ] Achieve minimum 70% code coverage
- [ ] Update AGENTS.md with testing requirements
- [ ] Commit: Unit tests implementation

---

### Phase 17: QA Testing and Security Review

**Status:** Pending
**Goal:** Comprehensive quality assurance and security audit

#### Todo List:
- [ ] Perform security review of shell script execution
- [ ] Review file permission handling
- [ ] Check for SQL injection vulnerabilities
- [ ] Test input validation on all endpoints
- [ ] Test error handling scenarios
- [ ] Verify .env file security
- [ ] Test service isolation and permissions
- [ ] Create QA test checklist
- [ ] Execute full QA test suite
- [ ] Document security considerations
- [ ] Create remediation plan for issues found
- [ ] Fix all critical and high-priority issues
- [ ] Retest after fixes
- [ ] Commit: QA and security improvements

---

### Phase 18: Documentation Completion

**Status:** Pending
**Goal:** Finalize all project documentation

#### Todo List:
- [ ] Complete installation guide
- [ ] Complete user manual
- [ ] Complete API documentation
- [ ] Complete developer documentation
- [ ] Document all configuration options
- [ ] Create troubleshooting guide
- [ ] Create FAQ document
- [ ] Update README.md with project overview
- [ ] Review all documentation for accuracy
- [ ] Update docs/index.md with all links
- [ ] Commit: Documentation completion

---

### Phase 19: Final Polish and Optimization

**Status:** Pending
**Goal:** Performance optimization and UX improvements

#### Todo List:
- [ ] Optimize frontend bundle size
- [ ] Optimize API response times
- [ ] Improve loading states and user feedback
- [ ] Add helpful tooltips and guidance
- [ ] Optimize database queries
- [ ] Review and clean up code
- [ ] Remove debug logging from production
- [ ] Test on fresh Ubuntu 24 installation
- [ ] Create final bug list and fix
- [ ] Commit: Final optimizations

---

### Phase 20: Project Completion

**Status:** Pending
**Goal:** Final review and project delivery

#### Todo List:
- [ ] Review all requirements against implementation
- [ ] Verify all instruction phases completed
- [ ] Final test of entire application
- [ ] Review all documentation
- [ ] Create project summary document
- [ ] Update progress logs
- [ ] Final commit and tag release
- [ ] Project complete!

---

## Technical Architecture

### Database Schema (SQLite)

```sql
-- Config settings table
CREATE TABLE configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT, -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Models table
CREATE TABLE models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  repo_id TEXT UNIQUE NOT NULL, -- HuggingFace repo ID
  filename TEXT,
  file_path TEXT,
  size_bytes INTEGER,
  downloaded BOOLEAN DEFAULT 0,
  download_progress INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Build history table
CREATE TABLE build_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_type TEXT, -- 'cpu', 'cuda', 'rocm'
  status TEXT, -- 'in_progress', 'success', 'failed'
  log_output TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Service status table
CREATE TABLE service_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT UNIQUE NOT NULL,
  status TEXT, -- 'running', 'stopped', 'error'
  pid INTEGER,
  last_check DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints Structure

**System & Hardware**
- `GET /api/system/info` - Get system hardware information
- `GET /api/system/metrics` - Get current system metrics (CPU, RAM, GPU)

**Llama.cpp Management**
- `POST /api/llama/build` - Start llama.cpp build process
- `GET /api/llama/build/status` - Get build status
- `GET /api/llama/build/history` - Get build history

**Service Management**
- `POST /api/service/install` - Install systemd service
- `POST /api/service/start` - Start service
- `POST /api/service/stop` - Stop service
- `POST /api/service/restart` - Restart service
- `GET /api/service/status` - Get service status

**Model Management**
- `GET /api/models/search?q=query` - Search HuggingFace models
- `POST /api/models/download` - Download model from HuggingFace
- `GET /api/models/list` - List local models
- `DELETE /api/models/:id` - Delete model
- `GET /api/models/download/progress/:id` - Get download progress

**Configuration**
- `GET /api/config` - Get all configurations
- `POST /api/config` - Update configuration
- `GET /api/config/:key` - Get specific config value

**Repository Management**
- `POST /api/repo/update` - Trigger repository update
- `GET /api/repo/status` - Get repository status

**Documentation**
- `GET /api/docs` - List all documentation files
- `GET /api/docs/:file` - Get documentation file content

### Frontend Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.vue
│   │   ├── Sidebar.vue
│   │   └── Header.vue
│   ├── dashboard/
│   │   ├── SystemMetrics.vue
│   │   ├── CpuGauge.vue
│   │   ├── MemoryGauge.vue
│   │   └── GpuGauge.vue
│   ├── llama/
│   │   ├── BuildInterface.vue
│   │   ├── BuildHistory.vue
│   │   └── ServiceControl.vue
│   ├── models/
│   │   ├── ModelSearch.vue
│   │   ├── ModelList.vue
│   │   └── ModelDownload.vue
│   ├── docs/
│   │   ├── DocumentationViewer.vue
│   │   └── DocumentationNav.vue
│   └── common/
│       ├── ProgressBar.vue
│       ├── LoadingSpinner.vue
│       └── ErrorMessage.vue
├── views/
│   ├── Dashboard.vue
│   ├── LlamaManagement.vue
│   ├── ModelManagement.vue
│   ├── Settings.vue
│   └── Documentation.vue
├── services/
│   ├── api.js
│   └── websocket.js
├── stores/
│   ├── system.js
│   ├── models.js
│   └── config.js
└── styles/
    └── theme.css (mint and white theme)
```

### Script Structure

```
scripts/
├── install/
│   ├── install-dependencies.sh     # Install system dependencies
│   ├── install-cuda.sh             # Install CUDA toolkit (optional)
│   └── setup-project.sh            # Initialize project
├── llama/
│   ├── clone-llama.sh              # Clone llama.cpp repository
│   ├── build-cpu.sh                # Build for CPU only
│   ├── build-cuda.sh               # Build with CUDA support
│   ├── build-rocm.sh               # Build with ROCm support
│   └── detect-hardware.sh          # Hardware detection helper
├── service/
│   ├── install-llama-service.sh    # Install llama-server systemd service
│   ├── install-frontend-service.sh # Install frontend systemd service
│   ├── install-updater-service.sh  # Install auto-updater service
│   └── templates/
│       ├── llama-server.service
│       ├── frontend.service
│       └── repo-updater.service
└── update/
    ├── update-repo.sh              # Pull latest changes and rebuild
    └── check-updates.sh            # Monitor for updates (daemon)
```

## Key Design Decisions

1. **Minimal Dependencies:** Using native Node.js features where possible, SQLite for simplicity, no heavy ORMs
2. **Shell Script Approach:** Using bash scripts for system operations (hardware detection, builds, service management)
3. **REST API:** Simple REST API instead of GraphQL for straightforward client-server communication
4. **Polling vs WebSocket:** Will use polling for metrics initially, can upgrade to WebSocket if needed
5. **Service Management:** Using systemd for service management as it's standard on Ubuntu 24
6. **Network Access:** Express.js will bind to 0.0.0.0 to allow network access, with CORS configuration
7. **Build Optimization:** Hardware detection will automatically select optimal build flags for llama.cpp

## Risk Assessment and Mitigation

**Risk 1: GPU Detection Complexity**
- Mitigation: Start with CPU-only build, add GPU support incrementally with clear fallbacks

**Risk 2: Service Permission Issues**
- Mitigation: Clear documentation on sudo requirements, error messages for permission issues

**Risk 3: Large Model Downloads**
- Mitigation: Implement proper progress tracking, resume capability, disk space checks

**Risk 4: Build Process Failures**
- Mitigation: Comprehensive logging, hardware prerequisite checks, build retry mechanism

**Risk 5: Network Security**
- Mitigation: Recommend firewall configuration, optional authentication in future phase

## Open Questions for User

Based on the creative liberty level of 5/10, I may need clarification on:

1. **Authentication:** Should the web interface have user authentication, or is it trusted LAN only?
2. **Model Storage:** Where should downloaded models be stored? (default: `./models/`?)
3. **Llama.cpp Location:** Where should llama.cpp be cloned and built? (default: `./llama.cpp/`?)
4. **Port Configuration:** What ports should be used for frontend and llama-server? (defaults: 3000, 8080?)
5. **Auto-update Frequency:** How often should the update monitor check for changes? (default: every 5 minutes?)

I'll proceed with reasonable defaults unless you specify preferences.

## Success Criteria

- ✅ System can detect hardware (CPU, GPU, memory)
- ✅ System can clone and build llama.cpp with optimal settings
- ✅ System can install and manage llama-server as a systemd service
- ✅ Frontend accessible over network on port 3000 (or configured port)
- ✅ Can search, download, and manage HuggingFace models
- ✅ Real-time system metrics display
- ✅ Auto-update system monitors and updates repository
- ✅ Comprehensive documentation available in-app
- ✅ All services start on system boot
- ✅ Unit test coverage > 70%
- ✅ Zero critical security vulnerabilities

## Progress Tracking

- Phase 1 (Planning): **IN PROGRESS** - 20% complete
- Overall Project: **2% complete**

---

*This plan is a living document and will be updated as the project progresses.*
