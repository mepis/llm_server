# AGENTS.md

## Build/Lint/Test Commands

### Build
```bash
# Initialize environment (install dependencies)
./scripts/init.sh

# Build llama.cpp with CUDA support
./scripts/build.sh
```

### Run
```bash
# Run with Qwen3.5-35B Q8 quantization
./scripts/run.sh

# Or run specific models directly:
./scripts/run_qwen3.5-35-q8.sh      # Q8 quantization
./scripts/run_qwen3.5-35-q6-k-s.sh  # Q6_K_S quantization

# Stop server
./scripts/kill.sh
```

### Benchmark
```bash
# Run performance benchmarks
./scripts/benchmark.sh
```

### Test
This repository does not have automated tests. Testing is done manually by:
1. Running the server with `./scripts/run.sh`
2. Verifying inference with an LLM client
3. Checking logs in `~/.llm_server/logs/`

## Code Style Guidelines

### Shell Scripts (Bash)
- Use `#!/bin/bash` shebang
- Set `LLM_SERVER_HOME` variable at top of scripts
- Use uppercase for configuration variables (e.g., `port=11434`)
- Group related configurations with comments (e.g., `# Host Configs`, `# Model Configs`)
- Use `set -euo pipefail` for robustness in production scripts
- Quote all variable expansions: `"$var"` not `$var`
- Use `./scripts/kill.sh` pattern for process management with `pkill`

### TypeScript (Bun runtime)
- Use ESM imports: `import { tool } from "@opencode-ai/plugin"`
- Follow existing patterns in `integrations/opencode/tools/`
- Use `tool.schema.string().describe()` for argument schemas
- Async/await for all I/O operations
- Trim return values: `result.trim()`

### JavaScript (Node.js)
- Use CommonJS (`require`/`module.exports`)
- Handle errors with try/catch blocks
- Exit with proper codes: `process.exit(1)` on errors
- Set global configurations early (e.g., HTTPS agent settings)

### Naming Conventions
- Shell scripts: lowercase with hyphens (`run_qwen3.5-35-q8.sh`)
- Service files: lowercase (`llama.service`, `opencode-web.service`)
- TypeScript: lowercase with underscores for tools (`search_the_web.ts`)
- JavaScript: lowercase (`search.js`)

### Error Handling
- Shell: Check exit codes, use `|| echo "message"` patterns
- JavaScript/TypeScript: Use try/catch with `process.exit(1)` on failure
- Log errors with descriptive messages

### Configuration
- Environment variables: UPPERCASE with underscores (`GGML_CUDA=ON`, `LLAMA_CACHE`)
- Service files use systemd format with `[Unit]`, `[Service]`, `[Install]` sections
- Keep hardcoded paths in variables at script top

## Project Structure
```
llm_server/
├── scripts/           # Shell scripts for build, run, benchmark
├── integrations/
│   ├── linux/
│   │   └── services/  # Systemd service files
│   └── opencode/
│       ├── config/
│       ├── services/
│       └── tools/     # TypeScript/JavaScript tool integrations
```

## Key Technologies
- **llama.cpp**: Main inference engine (built with CUDA support)
- **Bun**: JavaScript runtime for tool execution
- **Node.js**: Alternative runtime for tools
- **CMake**: Build system for llama.cpp
- **Systemd**: Service management

## Common Patterns
- Model paths: `~/.llm_server/models/`
- Logs: `~/.llm_server/logs/`
- Build output: `llama.cpp/build/bin/`
- GPU configuration: `--split-mode layer/row`, `--tensor-split`
- Context handling: `-c` flag with context size
