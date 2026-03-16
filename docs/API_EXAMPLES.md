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