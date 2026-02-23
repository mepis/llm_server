# Change Log - Core Infrastructure

**Date:** 2026-02-22
**Commit:** e992948
**Type:** Feature

## Merge Request Title

feat: Core infrastructure with Express.js and SQLite

## Summary

Implemented Phase 3 - Core Infrastructure Development with complete backend foundation including database layer, Express server, and system monitoring APIs.

## Changes Made

### Database Layer

**Database Module (`server/models/database.js`):**
- Implemented SQLite database using sql.js library
- Complete database class with initialization, CRUD operations
- Auto-save functionality after write operations
- Graceful shutdown and database persistence
- Schema initialization with tables:
  - `configs` - Configuration key-value storage
  - `models` - HuggingFace model tracking
  - `build_history` - Llama.cpp build history
  - `service_status` - Service monitoring
- Indexes for optimized queries
- Helper methods: `query()`, `run()`, `get()`, `all()`

### Express.js Server

**Main Server (`server/index.js`):**
- Express.js server setup with CORS enabled
- JSON and URL-encoded request parsing
- Request logging middleware
- Health check endpoint (`/api/health`)
- Error handling middleware (dev/prod modes)
- 404 handler for missing API routes
- Static file serving for production frontend
- Graceful shutdown handlers (SIGTERM/SIGINT)
- Database initialization on startup
- Environment variable configuration

### System Monitoring

**System Utilities (`server/utils/system.js`):**
- `getCPUInfo()` - CPU model, cores, architecture, load average
- `getCPUUsage()` - Real-time CPU usage calculation
- `getMemoryInfo()` - Total, used, free memory with percentages
- `detectNvidiaGPU()` - NVIDIA GPU detection via nvidia-smi
- `detectAMDGPU()` - AMD GPU/ROCm detection
- `getGPUInfo()` - Unified GPU information (NVIDIA/AMD/none)
- `getRecommendedBuildType()` - Auto-detect cpu/cuda/rocm
- `getSystemInfo()` - Complete system profile
- `getSystemMetrics()` - Real-time metrics for monitoring

**System Controller (`server/controllers/systemController.js`):**
- `getInfo()` - Complete system information
- `getMetrics()` - Real-time system metrics
- `getCPU()` - CPU-specific information
- `getMemory()` - Memory-specific information
- `getGPU()` - GPU-specific information

**System Routes (`server/routes/system.js`):**
- GET `/api/system/info` - System information
- GET `/api/system/metrics` - Real-time metrics
- GET `/api/system/cpu` - CPU details
- GET `/api/system/memory` - Memory details
- GET `/api/system/gpu` - GPU details

### Package Changes

**Dependency Change:**
- Replaced `better-sqlite3@^9.2.2` with `sql.js@^1.8.0`
- Reason: Node.js 24 C++20 compatibility issues with better-sqlite3
- sql.js is pure JavaScript, no native compilation required

**Updated Scripts:**
- Updated all scripts for ES modules

## Files Added

- `server/models/database.js` - Database layer
- `server/index.js` - Express server
- `server/utils/system.js` - System utilities
- `server/controllers/systemController.js` - System controller
- `server/routes/system.js` - System routes
- `logs/change_logs/2026-02-22_initial_setup.md` - Previous changelog
- `data/llm_server.db` - SQLite database file (not in git)

## Files Modified

- `package.json` - Updated dependencies and fixed better-sqlite3 issue
- `logs/change_logs/changelog_index.md` - Added initial setup entry

## Dependencies Updated

**Removed:**
- better-sqlite3 (C++ compilation issues with Node.js 24)

**Added:**
- sql.js@^1.8.0 (Pure JavaScript SQLite)

## API Endpoints Added

- `GET /api/health` - Health check
- `GET /api/system/info` - Complete system information
- `GET /api/system/metrics` - Real-time system metrics
- `GET /api/system/cpu` - CPU information
- `GET /api/system/memory` - Memory information
- `GET /api/system/gpu` - GPU information

## Testing

**Server Startup:**
- ✅ Server starts successfully on port 3000
- ✅ Database initializes and creates schema
- ✅ Database file created at `data/llm_server.db`
- ✅ Verified as valid SQLite 3.x database

**API Endpoints:**
- ✅ `/api/health` - Returns healthy status
- ✅ `/api/system/info` - Returns complete system info
  - Platform: linux
  - OS: Linux 6.6.87.2-microsoft-standard-WSL2
  - CPU: Intel(R) Core(TM) i7-14700HX, 28 cores
  - Memory: 15.47 GB total
  - GPU: None detected (WSL environment)
  - Recommended build: cpu
- ✅ `/api/system/metrics` - Returns real-time metrics
  - CPU usage: 0.38%
  - Memory usage: 11.43% (1.77 GB / 15.47 GB)

**Hardware Detection:**
- ✅ CPU detection working correctly
- ✅ Memory calculation accurate
- ✅ GPU detection gracefully handles no GPU
- ✅ Build type recommendation working

## Impact

- Established complete backend foundation
- Database layer ready for config and model management
- System monitoring ready for frontend integration
- API structure established for future endpoints
- Server fully functional and tested

## Known Issues

None

## Next Steps

Phase 4 - System Detection and Hardware Analysis:
- None needed - already implemented in this phase!

Move to Phase 5 - Llama.cpp Build Scripts:
- Create dependency installation script
- Create llama.cpp clone script
- Implement build scripts for CPU/CUDA/ROCm
- Create build management API endpoints

## Notes

- Successfully resolved Node.js 24 compatibility by switching to sql.js
- ES modules working correctly throughout codebase
- System detection comprehensive and working in WSL2 environment
- Ready for script development phase
- All API responses follow consistent format: `{success, data/error}`
