# Go Server Documentation

## Overview
The Go server is a lightweight replacement for the original Node.js Express server. It serves the built VuePress documentation from the `docs/.vuepress/dist` directory and supports SPA routing by falling back to `index.html` for any unknown routes.

## Directory Layout
```
/home/jon/git/llm_server/server/
├── main.go          # Entry point for the Go server
└── go.mod           # Module definition (if needed)
```

## Building
```bash
# From the repository root
go build -o server/bin/llm-server ./server
```

The binary will be placed in `server/bin/llm-server`.

## Running
```bash
# Run the compiled binary
./server/bin/llm-server
```

Alternatively, you can run it directly with `go run`:
```bash
go run ./server/main.go
```

## Configuration
| Environment Variable | Description                              | Default |
|----------------------|------------------------------------------|---------|
| `PORT`               | Port on which the server listens         | `3000`  |

Set `PORT` to any available port if you need a different one.

## Request Handling
- **Static Files**: Served directly from the `dist` directory.
- **SPA Fallback**: For any request that does not map to an existing file, the server returns `index.html` to enable client-side routing.
- **404**: If neither the requested file nor `index.html` exist, a 404 response is returned.

## Health Check
The server does not implement a dedicated health check endpoint. You can use standard HTTP requests to `/` to verify that the service is running.

## Logging
The server logs the startup message in the format:
```
Docs server running at http://localhost:<PORT>
```

## License
This server is part of the LLM Server project and follows the same licensing terms.