# LLaMA.cpp API Server

A Go-based API server that provides OpenAI-compatible endpoints for LLaMA.cpp models.

## Features

- **OpenAI-compatible endpoints**:
  - `POST /v1/chat/completions` - Generate chat completions
  - `POST /v1/embeddings` - Generate embeddings
  - `GET /v1/models` - List available models
- **API key authentication** via JWT-style middleware
- **Streaming support** for chat completions using Server-Sent Events
- **Direct integration** with LLaMA.cpp via `llama-cli` subprocess
- **Lightweight** single binary deployment

## Quick Start

### Prerequisites

- Go 1.25+
- LLaMA.cpp built (see `llama.cpp` directory)
- A LLaMA model file (e.g., `ggml-model-q4_0.bin`)

### Build & Run

```bash
# Build the server
cd src/api
go build -o server

# Run with a model
export MODEL_PATH=/path/to/your/model
export API_KEY=your_api_key
./server
```

The server will start on `0.0.0.0:8080`.

### API Endpoints

#### Chat Completions
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "test-model",
    "prompt": "Hello world",
    "max_tokens": 128,
    "stream": true
  }'
```

#### Embeddings
```bash
curl -X POST http://localhost:8080/v1/embeddings \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "test-model",
    "input": "Hello world"
  }'
```

#### List Models
```bash
curl -X GET http://localhost:8080/v1/models \
  -H "Authorization: Bearer your_api_key"
```

#### Health Check
```bash
curl -X GET http://localhost:8080/health
```

### Streaming

Set `"stream": true` in the request to receive Server-Sent Events. The server will stream the completion token-by-token.

### Docker

Build and run with Docker:

```bash
docker build -t llm-api-server .
docker run -p 8080:8080 \
  -e MODEL_PATH=/model \
  -e API_KEY=your_key \
  llm-api-server
```

### Configuration

Environment variables:

| Variable | Description |
|----------|-------------|
| `MODEL_PATH` | Path to your LLaMA model file |
| `API_KEY` | API key for authentication |

### Development

- Watch mode: `go run main.go`
- Tests: `go test ./...`
- CI: GitHub Actions workflow in `.github/workflows/ci.yml`

### License

MIT