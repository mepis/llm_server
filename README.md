# Quickstart

## Overview
This repository contains the Llama.cpp LLM server implementation.

## Prerequisites
- CMake
- C++17-compatible compiler
- (Optional) GPU drivers for CUDA support

## Build
```bash
git clone https://github.com/yourorg/llm_server.git
cd llm_server
mkdir -p build && cd build
cmake .. -DGGML_CUDA=ON   # enable CUDA if available
cmake --build . --config Release
```

## Run
```bash
./build/llama-server --model <path-to-model> --port 8080
```

## Test
```bash
./tools/server/tests/tests.sh unit/test_chat_completion.py -v
```

## API Server
Instructions for building and running the API server.

### Build the API server
```bash
# Build only the API server target
cmake --build . --target llama-server --config Release
```

### Run the API server
```bash
./build/llama-server --model <path-to-model> --port 8080
```

(Optional) Enable CUDA:
```bash
cmake .. -DGGML_CUDA=ON
cmake --build . --target llama-server --config Release
```

### Example request
```bash
curl http://localhost:8080/completions -X POST -H "Content-Type: application/json" -d '{"prompt":"Hello world"}'
```

## Documentation
- See `docs/` for detailed guides.
- Check `AGENTS.md` for contribution guidelines.
