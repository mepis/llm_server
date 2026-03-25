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

### Vue.js (Frontend)
- Use `<script setup>` syntax with Composition API
- Use ESM imports: `import { ref, onMounted } from 'vue'`
- Use composables for reusable logic (e.g., `useScripts()`)
- Use scoped CSS in `<style scoped>` blocks
- Follow pattern: `handleAction()` for event handlers
- Use async/await for API calls with try/catch error handling

### Backend (Express.js)
- Use CommonJS (`require`/`module.exports`)
- Follow MVC pattern: `controllers/`, `services/`, `routes/`
- Use class-based controllers with async methods
- Services return plain objects or throw errors
- Controllers handle HTTP responses (res.json, res.status)
- Use `module.exports = new ServiceName()` for singleton services

### Naming Conventions
- Shell scripts: lowercase with hyphens (`run_qwen3.5-35-q8.sh`)
- Service files: lowercase with camelCase (`scriptService.js`)
- Controller files: lowercase with camelCase (`scriptController.js`)
- Route files: lowercase plural (`scripts.js`, `services.js`)
- Vue components: PascalCase with Vue suffix (`ScriptsView.vue`)
- Composables: `use` prefix (`useScripts.js`)
- TypeScript tools: lowercase with underscores (`search_the_web.ts`)

### Error Handling
- Shell: Check exit codes, use `|| echo "message"` patterns
- JavaScript/TypeScript: Use try/catch with `process.exit(1)` on failure
- Express: Catch errors in controllers, return `res.status(500).json({ error })`
- Vue: Log errors with `console.error()`, display user-friendly messages
- Services: Throw descriptive errors: `throw new Error('Failed to: ${reason}')`

### Configuration
- Environment variables: UPPERCASE with underscores (`GGML_CUDA=ON`, `LLAMA_CACHE`)
- Service files use systemd format with `[Unit]`, `[Service]`, `[Install]` sections
- Keep hardcoded paths in variables at script top
- Use `process.env.VAR || defaultValue` for fallbacks

### API Patterns
- RESTful endpoints: `/api/scripts`, `/api/services`, `/api/models`
- Error responses: `{ error: 'message' }`
- Success responses: `{ success: true, message: '...' }` or `{ data: {...} }`
- Axios client configured with `/api` base URL and 30s timeout

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
├── backend/
│   ├── config/        # Configuration loading
│   ├── controllers/   # Express controllers (MVC pattern)
│   ├── middleware/    # Express middleware
│   ├── routes/        # Express route definitions
│   ├── services/      # Business logic services
│   ├── utils/         # Utility functions
│   └── server.js      # Express app entry point
└── frontend/
    ├── src/
    │   ├── api/       # Axios client configuration
    │   ├── components/ # Reusable Vue components
    │   ├── composables/# Vue Composition API hooks
    │   ├── stores/    # Pinia stores
    │   ├── styles/    # Global styles
    │   ├── views/     # Page components
    │   ├── App.vue    # Root component
    │   ├── main.js    # App entry point
    │   └── router.js  # Vue Router configuration
    └── index.html
```

## Key Technologies
- **llama.cpp**: Main inference engine (built with CUDA support)
- **Bun**: JavaScript runtime for tool execution
- **Node.js**: Alternative runtime for tools and backend
- **Vue.js 3**: Frontend framework with Composition API
- **Express.js**: Backend API server
- **CMake**: Build system for llama.cpp
- **Systemd**: Service management
- **Vite**: Frontend build tool
- **Pinia**: State management
- **Vue Router**: Client-side routing

## Common Patterns
- Model paths: `~/.llm_server/models/`
- Logs: `~/.llm_server/logs/`
- Scripts: `~/.llm_server/scripts/`
- Build output: `llama.cpp/build/bin/`
- GPU configuration: `--split-mode layer/row`, `--tensor-split`
- Context handling: `-c` flag with context size
- CUDA environment: `GGML_CUDA=ON`, `GGML_CUDA_FORCE_MMQ=true`