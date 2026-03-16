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