# TTS Migration to Chatterbox - Implementation Todo Index

This directory contains detailed implementation checklists for migrating the TTS system from llama.cpp voice model to Chatterbox Turbo via a Python gRPC microservice.

## How to Use

Each file is a self-contained checklist for one implementation phase. Coding agents should:
1. Read the index file above to understand the overall scope
2. Work through phases sequentially (Phase 1 → Phase 8)
3. Complete every item in a phase before moving to the next
4. Verify each step works before proceeding

## Files

| File | Phase | Summary | Estimated Effort |
|------|-------|---------|-----------------|
| [todo-phase1-create-directory.md](./todo-phase1-create-directory.md) | 1 | Create `src/services/chatterbox/` directory, proto file, Python requirements, and shell scripts for gRPC compilation and service startup | ~15 min |
| [todo-phase2-python-server.md](./todo-phase2-python-server.md) | 2 | Implement the Python gRPC server (`tts_service.py`) that loads ChatterboxTurboTTS, handles speech generation requests, manages speaker embeddings, and encodes output as base64 WAV | ~30 min |
| [todo-phase3-node-dependencies.md](./todo-phase3-node-dependencies.md) | 3 | Install Node.js gRPC dependencies (`@grpc/grpc-js`, `@grpc/proto-loader`) and compile proto stubs for both Python and Node.js | ~5 min |
| [todo-phase4-configuration.md](./todo-phase4-configuration.md) | 4 | Add `chatterbox` config section to `src/config/database.js` and add 6 environment variables to `.env.example` (or `.env`) | ~10 min |
| [todo-phase4.5-controller.md](./todo-phase4.5-controller.md) | 4.5 | Update `llamaController.js` to pass `speakerAudio` (base64 WAV bytes) instead of `speakerFile` path for inline voice cloning | ~5 min |
| [todo-phase5-llama-service.md](./todo-phase5-llama-service.md) | 5 | Replace the existing `generateAudio()` function in `llamaService.js` with a gRPC client call. Add helper functions for loading proto, initializing client, spawning service, health checking, and graceful shutdown | ~45 min |
| [todo-phase6-server-lifecycle.md](./todo-phase6-server-lifecycle.md) | 6 | Update `src/server.js` to spawn the Chatterbox Python process on startup, wait for health readiness, initialize the gRPC client, and handle SIGTERM/SIGINT shutdown | ~15 min |
| [todo-phase7-testing.md](./todo-phase7-testing.md) | 7 | Run integration tests: standalone Python service test, gRPC stub verification, and full stack E2E test through frontend speaker button | ~30 min |
| [todo-phase8-cleanup.md](./todo-phase8-cleanup.md) | 8 | Remove old llama.cpp TTS code from `llamaService.js`, update AGENTS.md with a note about Chatterbox requirements, and verify no references to old `TTS_SPEAKER_FILE` remain | ~15 min |

## Total Estimated Effort

~3 hours for an experienced coding agent. The most complex phases are Phase 2 (Python server) and Phase 5 (Node.js gRPC integration).

## Prerequisites Checklist

Before starting any phase, verify:
- [ ] Python 3.10+ is installed (`python3 --version`)
- [ ] CUDA-capable GPU is available (`nvidia-smi` shows GPU with memory)
- [ ] pip is available for Python dependencies (`pip3 --version`)
- [ ] Node.js ≥24.12.0 is installed (`node --version`)
- [ ] MongoDB is running and accessible
- [ ] The repo is at `/home/jon/git/llm_server`
