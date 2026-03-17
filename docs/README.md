# LLaMA.cpp API Server Documentation

## Overview
A Go-based API server that provides OpenAI-compatible endpoints for LLaMA.cpp models. It serves:
- Chat completions (`/v1/chat/completions`) with streaming support
- Embeddings (`/v1/embeddings`)
- Model listing (`/v1/models`)
- Health check (`/health`)
- Vue3 application from `src/app/dist`

## Architecture
```
src/
 ├─ api/            # Go server (Gin framework)
 │   ├─ main.go
 │   ├─ go.mod
 │   ├─ internal/
 │   │   ├─ model/   # Wrapper around LLaMA.cpp
 │   │   ├─ config/  # Env config
 │   │   ├─ handlers/# API route handlers
 │   │   └─ middleware/# Auth middleware
 │   └─ llama.cpp/   # Cloned & built LLaMA.cpp source
 └─ app/            # Vue3 frontend (built to dist/)
```

## Prerequisites
- **Go**: 1.25+  
- **Git**: for cloning repositories  
- **CMake**: 3.14+ (to build LLaMA.cpp)  
- **C/C++ compiler**: GCC/Clang with OpenMP support  
- **Docker** (optional, for container deployment)  

## Setup

### 1. Clone this repository
```bash
git clone <repo-url> llm_server
cd llm_server
```

### 2. Populate LLaMA.cpp
The `setup-llama.sh` script automates cloning and building LLaMA.cpp:

```bash
cd src/api
chmod +x setup-llama.sh
./setup-llama.sh
```

The script will:
1. Clone `https://github.com/ggml-org/llama.cpp.git` into `llama.cpp/` if missing.  
2. Pull latest changes if already present.  
3. Build the `llama-cli` binary using CMake.

### 3. Install Go dependencies
```bash
cd src/api
go mod tidy
```

### 4. Build the server binary
```bash
go build -o server .
```

### 5. Run the server
```bash
export MODEL_PATH=/path/to/your/ggml-model.bin
export API_KEY=your_api_key
./server
```

The server starts on `0.0.0.0:8080` by default.  
Vue3 app is available at `http://localhost:8080/app/`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/chat/completions` | Generate chat completions. Set `"stream": true` for SSE streaming. |
| `POST` | `/api/v1/embeddings` | Generate embeddings for input text. |
| `GET`  | `/api/v1/models` | List available models (placeholder data). |
| `GET`  | `/health` | Health check endpoint. |
| `GET`  | `/app/*` | Serves Vue3 static files (SPA fallback). |

### Example Requests
```bash
# Chat completion (non-streaming)
curl -X POST http://localhost:8080/api/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"test","prompt":"Hello","max_tokens":64}'

# Streamed completion
curl -X POST http://localhost:8080/api/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"test","prompt":"Hello","max_tokens":64,"stream":true}'
```

## Docker

```bash
docker build -t llm-api-server .
docker run -p 8080:8080 \
  -e MODEL_PATH=/model \
  -e API_KEY=your_key \
  llm-api-server
```

## Testing
```bash
go test ./... -v
```

## CI/CD
GitHub Actions workflow defined in `.github/workflows/ci.yml` runs:
- `go test`  
- `go vet` / `staticcheck`  
- Build Docker image on tag pushes.

## License
MIT © 2026