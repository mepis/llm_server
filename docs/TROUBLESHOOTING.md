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