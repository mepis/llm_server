#!/usr/bin/env bash
set -euo pipefail

# Build the Go API server
echo "Building Go API server..."
go version
go build -o ./bin/api-server ./cmd/api-server

echo "Build completed. Binary is at ./bin/api-server"