tags: [llama, health]
role: backend-developer

# healthCheck()

Simple GET request to `GET ${config.llama.url}/health` (5-second timeout) to verify Llama.cpp server connectivity.

**Returns:** Response data on success, or `null` on failure (errors are logged, not thrown). Useful for status pages and readiness checks.

---
[Back to Llama Service Functions](./llama-service-functions.md)
