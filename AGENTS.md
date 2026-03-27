# AGENTS.md - Guidelines for Agentic Coding Tools

## Build, Lint, and Test Commands

### Build Commands
- `./scripts/build.sh` - Build llama.cpp with CUDA support
  - Uses CMake with CUDA, OpenBLAS, and shared libs disabled
  - Output: `~/.llm_server/llama.cpp/build/bin/llama-server`
  - Key flags: `-DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DGGML_BLAS=ON`

### Run Commands
- `./scripts/run.sh` - Run default model (Qwen3.5-35B Q8)
- `./scripts/run_qwen3.5-35-q8.sh` - Run specific quantization
- `./scripts/kill.sh` - Stop all llama.cpp instances (`sudo pkill -f "llama"`)

### Benchmark Commands
- `./scripts/benchmark.sh` - Run performance benchmarks
  - Interactive: prompts for model selection
  - Uses `llama_bench` binary with multi-GPU configuration

### Environment Setup
- `./scripts/init.sh` - Initialize environment and install dependencies
- `./scripts/update.sh` - Pull latest changes and restart service
- `./scripts/uninstall.sh` - Remove installation

### No Test Framework
- This is a C/C++ project with no automated test suite
- Manual testing via API endpoints on port 11434
- Benchmark script serves as performance validation

## Code Style Guidelines

### Shell Script Conventions

**Imports/Setup:**
```bash
# Always define paths at top
LLM_SERVER_HOME=~/.llm_server
MODELS_DIR="${LLM_SERVER_HOME}/models"

# Export required environment variables
export CUDACXX=/usr/local/cuda/bin/nvcc
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1
```

**Formatting:**
- 2-space indentation for nested blocks
- Blank lines between logical sections (configs, model configs, execution)
- Comments with `#` for inline notes, `# Section` for headers
- Maximum line length: 120 characters

**Variable Naming:**
- UPPERCASE for constants and environment variables
- lowercase for local variables
- Descriptive names: `context`, `tensorSplit`, `splitMode`

**Error Handling:**
```bash
# Check command success
command || echo "Error message"
sudo pkill -f "llama" && echo "Killed" || echo "Not found"
```

**Best Practices:**
- Use `cd "${PATH}"` with quotes for paths with spaces
- Explicit `export` for all environment variables
- Separate hardware/model configs with comment headers
- Use meaningful defaults with documented values

### C/C++ Conventions (llama.cpp)

**CMake Configuration:**
- Follow llama.cpp defaults
- Disable shared libs: `-DBUILD_SHARED_LIBS=OFF`
- Enable GPU backends as needed: `-DGGML_CUDA=ON`
- Use OpenBLAS for CPU fallback: `-DGGML_BLAS=ON`

**Environment Variables:**
- `GGML_CUDA=ON` - Enable CUDA backend
- `GGML_CUDA_PEER_MAX_BATCH_SIZE` - Multi-GPU batch size
- `OMP_NUM_THREADS` - CPU thread count
- `LLAMA_CACHE` - Model cache directory

## Cursor/Copilot Rules

No existing Cursor rules (`.cursor/rules/`, `.cursorrules`) or Copilot rules (`.github/copilot-instructions.md`) found in this repository.

## Key Paths

- **Home Directory:** `~/.llm_server/`
- **Build Directory:** `~/.llm_server/llama.cpp/build/`
- **Binary:** `~/.llm_server/llama.cpp/build/bin/llama-server`
- **Models:** `~/.llm_server/models/`
- **Logs:** `~/.llm_server/logs/`

## API Reference

- **Base URL:** `http://localhost:11434`
- **Chat Completion:** `POST /api/chat`
- **Model Info:** `GET /api/models`
- **Stop Server:** `POST /api/stop`

## Common Patterns

1. **Script Structure:**
   ```bash
   #!/bin/bash
   # Define paths
   # Configure variables
   # Execute command
   ```

2. **Multi-GPU Setup:**
   ```bash
   --tensor-split 16,12,12
   --split-mode layer
   --main-gpu 0
   ```

3. **Performance Tuning:**
   ```bash
   --poll 0           # Disable polling
   --kv-unified       # Unified KV cache
   --cont-batching    # Continuous batching
   ```
