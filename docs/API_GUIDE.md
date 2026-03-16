# LLM Server Documentation

This repository contains comprehensive technical documentation for the LLM Server project. The documentation is organized into multiple markdown files covering different aspects of the system.

## Documentation Files

## 1. ARCHITECTURE.md

## 2. API_GUIDE.md

## 3. INSTALL.md

## 4. CONFIGURATION.md

## 5. DEVELOPMENT.md

## 6. DEPLOYMENT.md

## 7. TROUBLESHOOTING.md

## 8. API_EXAMPLES.md

## 9. SECURITY.md

# API_GUIDE.md

## API Documentation

### Base URL

All API endpoints are available at `http://localhost:8080` by default.

### Authentication

All endpoints except `/health` and `/login` require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

## POST /login

Authenticate user credentials and obtain session token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "your-session-token"
}
```

## POST /run

Execute shell scripts.

**Request Body:**
```json
{
  "script": "start.sh"
}
```

**Response:**
```json
{
  "script": "start.sh",
  "output": "script output",
  "error": "script error (if any)"
}
```

## POST /v1/completions

Generate text completion based on prompt.

**Request Body:**
```json
{
  "prompt": "Hello, world!",
  "temperature": 0.8,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1,
  "max_context_tokens": 2048,
  "max_generating_tokens": 256,
  "model_path": "models/gguf/my_model.gguf"
}
```

**Response (non-streaming):**
```json
{
  "prompt": "Hello, world!",
  "generated_text": "Hello, world! How can I assist you today?",
  "used_params": {
    "temperature": 0.8,
    "top_p": 0.9,
    "top_k": 40,
    "repeat_penalty": 1.1,
    "max_context_tokens": 2048,
    "max_generating_tokens": 256
  },
  "message": "generated"
}
```

**Response (streaming):**
```
data: {"prompt":"Hello, world!","generated_text":"Hello, world! How can I assist you today?","used_params":{"temperature":0.8,"top_p":0.9,"top_k":40,"repeat_penalty":1.1,"max_context_tokens":2048,"max_generating_tokens":256},"message":"generated"}

data: {"prompt":"Hello, world!","generated_text":"Hello, world! How can I assist you today?","used_params":{"temperature":0.8,"top_p":0.9,"top_k":40,"repeat_penalty":1.1,"max_context_tokens":2048,"max_generating_tokens":256},"message":"generated"}

\n
```

## POST /v1/chat/completions

Generate chat completion based on conversation history.

**Request Body:**
```json
{
  "model": "local-llama.cpp",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.8,
  "top_p": 0.9,
  "top_k": 40,
  "repeat_penalty": 1.1,
  "max_context_tokens": 2048,
  "max_generating_tokens": 256,
  "stream": true
}
```

**Response:**
```json
{
  "id": "chat-1234567890",
  "object": "chat.completion",
  "created": 1678000000,
  "model": "local-llama.cpp",
  "choices": [
    {
      "key": "chat-1234567890",
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 25,
    "total_tokens": 35
  }
}
```

## GET /v1/models

List available models.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "local-llama.cpp",
      "object": "model",
      "owned_by": "local-llama.cpp"
    }
  ]
}
```

## Error Responses

### Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### Invalid Request
```json
{
  "error": "Invalid JSON"
}
```

### Missing Parameters
```json
{
  "error": "Missing required parameter"
}
```

# INSTALL.md

## Installation Guide

### System Requirements

- Go 1.24.4 or later
- Git
- CMake 3.14 or later
- Build tools (make, gcc/clang)
- MySQL server (for authentication)
- Node.js (for frontend development)

### Build Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake git mysql-server nodejs npm
```

#### macOS
```bash
brew install cmake git mysql node
```

#### Windows
- Install Git for Windows
- Install CMake
- Install Go from official website
- Install MySQL Installer
- Install Node.js

### Build Process

1. **Clone Repository**
```bash
git clone https://github.com/your-org/llm_server
cd llm_server
```

2. **Install Backend Dependencies**
```bash
cd src/api
go mod tidy
cd ..
```

3. **Install Frontend Dependencies**
```bash
cd src/app
npm install
cd ..
```

4. **Build the Server**
```bash
./scripts/build.sh
```

5. **Build Frontend**
```bash
cd src/app
npm run build
```

6. **Configure Database**
```bash
# Create users table
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS sessions;
USE sessions;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT IGNORE INTO users (username, password) VALUES ('admin', '$2a$10$5X6gQZfZ1yZ1g6iZ5XK5UuUeZ5g5eZ5g5eZ5g5eZ5g5eZ5g5eZ5g');
"

7. **Start Services**
```bash
./scripts/run.sh
```

### Configuration

Create `src/api/config.json` with desired configuration overrides.

### Running Tests

```bash
# Run all tests
./tools/server/tests/tests.sh unit/*.py

# Run specific test
./tools/server/tests/tests.sh unit/completions_test.py -v -k test_*
```

# CONFIGURATION.md

## Configuration Guide

### Default Configuration

The server uses a default configuration loaded from `src/api/config.json` with fallback defaults in code.

### Configuration Parameters

#### Model Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string | `"models/gguf/my_model.gguf"` | Path to model file |
| `temperature` | float | `0.8` | Sampling temperature |
| `top_p` | float | `0.9` | Nucleus sampling parameter |
| `top_k` | int | `40` | Top-k sampling parameter |
| `repeat_penalty` | float | `1.1` | Penalty for repeated tokens |
| `max_context_tokens` | int | `2048` | Maximum context window size |
| `max_generating_tokens` | int | `256` | Maximum generation length |

#### Chat Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chat_model_path` | string | `"models/gguf/my_model.gguf"` | Path to chat model |
| `chat_temperature` | float | `0.8` | Sampling temperature for chat |
| `chat_top_p` | float | `0.9` | Nucleus sampling for chat |
| `chat_top_k` | int | `40` | Top-k sampling for chat |
| `chat_repeat_penalty` | float | `1.1` | Penalty for repeated tokens in chat |
| `chat_max_context_tokens` | int | `2048` | Maximum context for chat |
| `chat_max_generating_tokens` | int | `256` | Maximum generation for chat |

### External Configuration

Configuration can be overridden by creating or modifying `src/api/config.json`:

```json
{
  "model": "models/gguf/my_model.gguf",
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 50,
  "repeat_penalty": 1.2,
  "max_context_tokens": 4096,
  "max_generating_tokens": 512,
  "chat_model_path": "models/gguf/my_chat_model.gguf",
  "chat_temperature": 0.9,
  "chat_top_p": 0.95,
  "chat_top_k": 50,
  "chat_repeat_penalty": 1.2,
  "chat_max_context_tokens": 4096,
  "chat_max_generating_tokens": 512
}
```

### Configuration Loading Process

1. Check for `config.json` file in `src/api/` directory
2. If file exists and is non-empty, load configuration from it
3. Merge loaded configuration with code defaults
4. Use merged configuration for API requests
5. Allow runtime parameter overrides via API request parameters

### Runtime Parameter Overrides

API request parameters can override default configuration:

- `temperature`, `top_p`, `top_k`, `repeat_penalty`, `max_context_tokens`, `max_generating_tokens` can be specified in request
- When specified, these values override the defaults for that request
- Parameters not specified in request use default values

# DEVELOPMENT.md

## Development Guide

### Code Structure

```
src/
├── api/           # Go API server
│   ├── main.go    # HTTP server and endpoints
│   ├── llama_gen.go  # Cgo wrapper for llama.cpp
│   ├── config.go    # Configuration management
│   └── ...         # Other API files
├── llm.cpp/       # Core llama.cpp integration
│   ├── CMakeLists.txt
│   └── ...         # C++ source files
├── app/           # Vue 3 frontend
│   ├── src/       # Vue source files
│   └── package.json
└── scripts/       # Automation scripts
    ├── build.sh
    └── run.sh
```

### Development Workflow

1. **Set Up Development Environment**
```bash
# Install dependencies
go get ./...
npm install --prefix ./src/app

# Build development versions
./scripts/build.sh --dev
npm run dev --prefix ./src/app
```

2. **Run Tests**
```bash
# Run all tests
./tools/server/tests/tests.sh unit/*.py

# Run specific test
./tools/server/tests/tests.sh unit/completions_test.py -v -k test_*
```

3. **Code Style**
- Follow Go naming conventions
- Use explicit types over `auto`
- Error handling: early returns for error paths
- Use versioned constants for feature flags
- Follow Vue 3 Composition API patterns
- Use TypeScript for type safety

### Testing Approach

1. **Unit Tests**
   - Test individual functions and components
   - Located in `tests/unit/` directory
   - Use pytest for testing

2. **Integration Tests**
   - Test API endpoint interactions
   - Test authentication flow
   - Test model parameter processing

3. **Test Execution**
```bash
# Run all unit tests
./tools/server/tests/tests.sh unit/*.py

# Run single test with verbose output
./tools/server/tests/tests.sh unit/completions_test.py -v -x

# Run tests matching pattern
./tools/server/tests/tests.sh unit/*.py -k "test_.*_edge"
```

### Contribution Guidelines

1. Follow coding standards defined in AGENTS.md
2. Run `pre-commit run --all-files` before committing
3. Ensure all tests pass
4. Add tests for new functionality
5. Update documentation for new features
6. Keep changes focused and minimal
7. Submit pull requests with clear descriptions

# DEPLOYMENT.md

## Deployment Guide

### Production Build

1. **Build Optimized Binary**
```bash
# Configure build for release
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# Enable GPU acceleration if supported
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release
```

2. **Prepare Deployment Package**
```bash
# Copy necessary files
cp build/llama_server /usr/local/bin/
cp src/api/config.json /etc/llm_server/
cp scripts/llm_server.service /etc/systemd/system/
```

3. **Set Up Systemd Service**
```bash
# Install service
sudo cp scripts/llm_server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable llm-server
sudo systemctl start llm-server

# Verify service
sudo systemctl status llm-server
curl http://localhost:8080/health
```

### Docker Deployment (Optional)

1. **Build Docker Image**
```bash
docker build -t llm-server .
```

2. **Run Container**
```bash
docker run -d \
  --name llm-server \
  -p 8080:8080 \
  -v /path/to/models:/models \
  -v /etc/llm_server/config.json:/app/config.json \
  llm-server
```

### Configuration for Production

1. **Secure MySQL Database**
   - Use strong passwords
   - Implement proper access controls
   - Enable SSL/TLS for connections

2. **HTTPS Termination**
   - Use reverse proxy (Nginx, Apache)
   - Terminate SSL/TLS at proxy
   - Forward to HTTP backend

3. **Rate Limiting**
   - Implement rate limiting at proxy level
   - Limit requests per IP per minute
   - Prevent abuse and DoS attacks
   - Configure appropriate limits based on expected usage

4. **Logging**
   - Configure log rotation
   - Store logs securely
   - Monitor for anomalies

5. **Monitoring**
   - Track CPU/memory usage
   - Monitor request latency
   - Track error rates
   - Set up alerts for anomalies

# TROUBLESHOOTING.md

## Troubleshooting Guide

### Common Issues

#### Model Loading Failures
- **Symptoms**: Server fails to start or returns "model not found"
- **Solutions**:
  - Verify model path in configuration
  - Check file permissions (`chmod 644 models/gguf/my_model.gguf`)
  - Ensure model file exists at specified location
  - Check for sufficient disk space

#### Authentication Errors
- **Symptoms**: "Unauthorized" responses even with valid tokens
- **Solutions**:
  - Verify MySQL database is running
  - Check session table exists and has correct schema
  - Verify demo user is inserted into users table
  - Check token expiration logic

#### Build Errors
- **Symptoms**: CMake configuration fails or compilation errors
- **Solutions**:
  - Verify CMake version is 3.14+
  - Install required build dependencies
  - Clear build cache: `./scripts/build.sh clean`
  - Check for missing system libraries

#### Memory Issues
- **Symptoms**: Out of memory errors during generation
- **Solutions**:
  - Reduce `max_context_tokens` parameter
  - Use quantized model formats
  - Consider GPU acceleration for larger models
  - Monitor memory usage during operation

#### Performance Issues
- **Symptoms**: Slow response times or high latency
- **Solutions**:
  - Optimize generation parameters (temperature, top_p, top_k)
  - Use appropriate quantization level
  - Enable GPU acceleration if supported
  - Adjust `repeat_penalty` to reduce computation

### Debugging Techniques

1. **Check Logs**
   - View server logs: `journalctl -u llm-server -f`
   - Check application logs in `logs/` directory

2. **Verbose Mode**
   - Start server with debug output: `./llm_server --debug`

3. **Health Check**
   - Verify health endpoint: `curl http://localhost:8080/health`
   - Should return "OK"

4. **Test API Endpoints**
   - Test login: `curl -X POST http://localhost:8080/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'`
   - Test completions: `curl -X POST http://localhost:8080/v1/completions -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"prompt":"Hello"}'`

5. **Database Verification**
   - Check MySQL connection: `mysql -u root -p -e "SHOW TABLES;"
   - Verify tables exist: `USE sessions; SHOW TABLES;`

### Common Error Messages

- **"Model not found"**: Check model path configuration
- **"Unauthorized"**: Verify authentication token and MySQL connection
- **"Failed to create session"**: Check database schema and permissions
- **"Out of memory"**: Reduce context/token limits or use quantized models
- **"Connection refused"**: Ensure server is running and listening on correct port

# API_EXAMPLES.md

## API Usage Examples

### cURL Examples

#### Generate Text Completion
```bash
curl -X POST http://localhost:8080/v1/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms.",
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 50,
    "max_generating_tokens": 200
  }'
```

#### Generate Chat Completion
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local-llama.cpp",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"},
      {"role": "assistant", "content": "Paris is the capital of France."}
    ],
    "temperature": 0.8,
    "top_p": 0.9,
    "top_k": 40,
    "max_generating_tokens": 100
  }'
```

#### Get Available Models
```bash
curl -X GET http://localhost:8080/v1/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Login to Get Token
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

### Python Example

```python
import requests
import json

# Configuration
API_URL = "http://localhost:8080/v1/completions"
API_KEY = "your_token_here"

# Request payload
payload = {
    "prompt": "Write a poem about the ocean.",
    "temperature": 0.8,
    "top_p": 0.9,
    "top_k": 40,
    "max_generating_tokens": 256
}

# Make request
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

response = requests.post(API_URL, headers=headers, json=payload)

# Process response
if response.status_code == 200:
    result = response.json()
    print("Generated text:", result['generated_text'])
else:
    print(f"Error: {response.status_code}")
    print(response.text)
```

### JavaScript Example (Browser)

```javascript
// Configuration
const API_URL = 'http://localhost:8080/v1/chat/completions';
const API_TOKEN = 'your_token_here';

# Make request
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log('Response:', data.choices[0].message.content);
})
.catch(error => {
  console.error('Error:', error);
});
```

# SECURITY.md

## Security Guide

### Authentication Security

1. **Token-Based Authentication**
   - All API endpoints (except `/health` and `/login`) require Bearer token
   - Tokens are generated via `/login` endpoint
   - Tokens expire after 2 hours of inactivity
   - Token format: UUID-based with expiration tracking

2. **Session Management**
   - Sessions stored in MySQL `sessions` table
   - Each session has associated user ID
   - Sessions include expiration timestamp
   - Token validation checks database for valid, non-expired sessions

3. **Password Storage**
   - Passwords hashed using bcrypt
   - Default demo password hash provided in code
   - Production deployments should use secure password storage
   - Never log plaintext passwords

### Database Security

1. **MySQL Configuration**
   - Use strong, unique passwords
   - Implement network-level access controls
   - Enable SSL/TLS for database connections
   - Restrict database user privileges

2. **Database Schema**
   - `users` table stores usernames and hashed passwords
   - `sessions` table stores authentication tokens and expiration
   - Foreign key relationships enforce data integrity
   - Indexes on unique fields for performance

### Network Security

1. **HTTPS Implementation**
   - Deploy with TLS termination using reverse proxy
   - Use valid SSL certificates
   - Enforce HTTPS for all API requests
   - Disable HTTP traffic to API endpoints

2. **Rate Limiting**
   - Implement rate limiting at proxy level
   - Limit requests per IP per minute
   - Prevent abuse and DoS attacks
   - Configure appropriate limits based on expected usage

3. **Firewall Configuration**
   - Restrict API server access to trusted networks
   - Allow only necessary ports (typically 8080 for HTTP)
   - Block public access to database port (3306)
   - Implement network segmentation for production

### Application Security

1. **Input Validation**
   - Validate all JSON input parameters
   - Check for required fields
   - Validate parameter ranges and formats
   - Reject malformed requests early

2. **Error Handling**
   - Return generic error messages to avoid information leakage
   - Log detailed errors internally for debugging
   - Avoid exposing sensitive information in error responses
   - Use consistent error response format

3. **Dependency Management**
   - Keep all dependencies up to date
   - Monitor for security vulnerabilities
   - Apply security patches promptly
   - Use dependency scanning tools regularly

### Best Practices

1. **Regular Security Audits**
   - Review code for security vulnerabilities
   - Scan dependencies for known issues
   - Test for common attack vectors
   - Conduct penetration testing periodically

2. **Backup Strategy**
   - Regularly backup database contents
   - Store backups securely
   - Test restoration process
   - Maintain backup retention policy

3. **Monitoring and Logging**
   - Monitor authentication failures
   - Track unusual API usage patterns
   - Log security-relevant events
   - Set up alerts for suspicious activity

4. **Incident Response**
   - Have documented incident response procedures
   - Maintain contact information for security team
   - Prepare communication templates for breaches
   - Test incident response plan regularly

5. **Security Updates**
   - Stay informed about security advisories
   - Apply patches promptly
   - Test patches in staging environment
   - Schedule regular security maintenance windows