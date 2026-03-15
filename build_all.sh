#!/bin/bash
# Build VuePress documentation and the Go server

set -e  # Exit on any error

# 1. Install VuePress dependencies
echo "Installing VuePress dependencies..."
npm --prefix docs install

# 2. Build the VuePress documentation
echo "Building VuePress documentation..."
npm --prefix docs run docs:build

# 3. Build the Go server
echo "Building Go server..."
cd server
go build -o ../server/bin/llm-server .
cd ..

# 4. Final message
echo "Build completed successfully."
echo "VuePress documentation is in docs/.vuepress/dist"
echo "Go server binary is at server/bin/llm-server"

# 5. Start the server
echo "Starting Go server..."
./server/bin/llm-server &
echo "Go server started with PID $!"