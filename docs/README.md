# LLM Server - Technical Documentation

## Overview

LLM Server is a modular, production-ready Large Language Model inference server built on top of llama.cpp. It provides a REST API with OpenAI-compatible endpoints, authentication, and web interface, while maintaining high performance and low resource requirements.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/llm_server
cd llm_server

# Install dependencies
# - Go 1.24.4 or later
# - Git
# - CMake 3.14 or later
# - Build tools (make, gcc/clang)
# - MySQL server for authentication

# Build the server
./scripts/build.sh

# Download or prepare a model
cp your_model.gguf models/gguf/my_model.gguf

# Run the server
./scripts/run.sh
```

### First API Call

```bash
# Get an authentication token
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

{"token": "your-token-here"}

# Make a chat completion request
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local-llama.cpp",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.8,
    "max_tokens": 256
  }'
```

## Core Modules

### 1. API Server (`src/api/`)

Go-based REST API server providing text generation and chat completion endpoints with OpenAI compatibility.

**Components:**
- `main.go` - HTTP server with authentication middleware, chat completions, and text generation
- `llama_gen.go` - Cgo wrapper for llama.cpp text generation
- `config.go` - Configuration management with defaults and external config file support
- `completions_test.go` - API endpoint tests

**Endpoints:**
- `POST /login` - User authentication and session creation
- `POST /run` - Execute shell scripts
- `POST /v1/completions` - Text generation (requires authentication)
- `POST /v1/chat/completions` - Chat completions (OpenAI-compatible, requires authentication)
- `GET /v1/models` - List available models (OpenAI-compatible, requires authentication)
- `GET /health` - Health check endpoint

**Authentication:**
- MySQL-backed session management
- Bearer token authentication
- 2-hour token expiration
- Session tokens stored in `sessions` table with foreign key relationships to users

### 2. llama.cpp Integration (`src/llama.cpp/`)

Core LLM inference engine providing model loading, tokenization, and text generation capabilities.

**Features:**
- CMake-based build system
- libllama library for model loading and inference
- Multi-platform support (CPU and GPU variants)
- GGUF model format support
- Configurable runtime parameters (temperature, top_p, top_k, repeat_penalty)

**Build System:**
- CMake 3.14+ compatible
- Multiple build configurations available
- Clean build artifacts with make cleanup

### 3. Frontend Application (`src/app/`)

Vue 3 + Vite-based web interface for interacting with the LLM server.

**Features:**
- Real-time chat interface
- Configurable generation parameters
- Responsive design
- TypeScript-based component structure

**Tech Stack:**
- Vue 3 (Composition API)
- Vite for fast development and production builds
- JavaScript modules (ES6+)
- CSS/Styling for themes and responsive layout

### 4. Deployment Scripts (`scripts/`)

Shell scripts for automated deployment and service management.

**Scripts:**
- `build.sh` - Build the entire project
- `run.sh` - Start the API server
- `stop_service.sh` - Stop running services
- `restart_service.sh` - Restart services gracefully
- `benchmark.sh` - Performance benchmarking tools
- `service.sh` - Service management operations

### 5. Testing Infrastructure (`tools/server/tests/`)

Comprehensive test suite using pytest for API validation and integration testing.

**Features:**
- Automated test discovery
- Test execution with verbose output
- Single test capability with pytest filter syntax
- Test fixtures and setup/teardown
- Requirements specification for dependencies

## Configuration

### Default Configuration

The server uses sensible default values for model parameters:

```json
{
  "model": "models/gguf/my_model.gguf",
  "temperature": 0.8,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1,
  "max_context_tokens": 2048,
  "max_generating_tokens": 256
}
```

### External Configuration

Configuration can be overridden via `src/api/config.json`:

**Key Parameters:**
- `model`: Path to model file
- `temperature`: Sampling temperature (0.1-2.0)
- `top_p`: Nucleus sampling parameter
- `top_k`: Top-k sampling parameter
- `repeat_penalty`: Penalty for repeated tokens (1.0-2.0+)
- `max_context_tokens`: Maximum context window
- `max_generating_tokens`: Maximum generation length

**Chat-specific settings:**
- Separate `chat_*` parameters for chat models
- Independent temperature, top_p, top_k, repeat_penalty settings

### Database Schema

**Users Table:**
```
users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255) UNIQUE
)
```

**Sessions Table:**
```
sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) UNIQUE,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

Default demo user: `admin` / `password` (hash stored in database)

## Development

### Development Setup

```bash
# Install dependencies
go get ./...
npm install --prefix ./src/app

# Build development server
./scripts/build.sh

# Run tests
./tools/server/tests/tests.sh unit/*.py

# Run single test
./tools/server/tests/tests.sh unit/completions_test.py -v -k test_*
```

### Coding Standards

**Go Code:**
- Follow established Go naming conventions
- Use explicit types over `auto`
- Error handling: early returns for error paths, proper cleanup
- Documentation comments for public APIs
- Use versioned constants for feature flags

**Frontend Code:**
- ES6+ JavaScript syntax
- Vue 3 Composition API (`<script setup>`)
- TypeScript for type safety
- Follow Vite project structure

**C++ Code (llama.cpp):**
- 4-space indentation with tabs prohibited
- Standard library headers first, then project-specific
- Proper error handling with `llama_log`
- Use fixed-width integers for cross-platform compatibility

## Security Considerations

1. **Authentication Required**: All API endpoints except `/health` and `/login` require Bearer token authentication
2. **HTTPS Implementation**: Deploy with TLS/SSL in production environments
3. **Database Connection**: Use appropriate credentials and don't hardcode passwords
4. **Session Management**: Tokens expire after 2 hours; implement rotation policies
5. **Input Validation**: API validates all incoming JSON payloads
6. **Rate Limiting**: Consider implementing rate limiting for production deployments
7. **File Permissions**: Protect model files and configuration files from unauthorized access

## Deployment

### Production Deployment

```bash
# Build for production
./scripts/build.sh --release

# Start as systemd service
sudo ./scripts/service.sh install

# Start service
sudo systemctl start llm-server
sudo systemctl enable llm-server

# Check service status
sudo systemctl status llm-server
```

### Docker Deployment (Optional)

Docker configuration files can be added for containerized deployment.

## Troubleshooting

### Common Issues

**Model Loading Failures:**
- Verify model file path is correct
- Check file permissions (`chmod 644 models/gguf/my_model.gguf`)
- Ensure sufficient disk space for model loading

**Authentication Errors:**
- Verify MySQL database is running
- Check credentials in `src/api/config.json`
- Ensure session table exists and has demo user

**Build Errors:**
- Verify CMake version is 3.14+
- Check for required system dependencies
- Clear build cache: `./scripts/build.sh clean`

**Memory Issues:**
- Reduce `max_context_tokens` if running out of memory
- Use quantized model formats for lower resource requirements
- Consider GPU acceleration for larger models

## Performance Optimization

### Build Configuration

```bash
# Build with optimizations
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# Enable GPU acceleration
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release

# Debug build
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```

### Runtime Optimization

- Use appropriate quantization levels for model size
- Adjust `temperature`, `top_p`, and `top_k` for desired output quality
- Set `max_generating_tokens` to avoid excessive token generation
- Use `repeat_penalty > 1.0` to reduce repetition in generated text

## Contributing

1. Follow coding standards (AGENTS.md)
2. Run `pre-commit run --all-files` before committing
3. Ensure all tests pass
4. Add tests for new features
5. Document any new configuration options or features
6. Update this documentation with any significant changes

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues, questions, or contributions, please refer to the project repository and community channels.

## Resources

- [llama.cpp Documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/README.md)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vue 3 Documentation](https://vuejs.org/)