#!/bin/bash

# Function to kill all processes started by this script on exit
cleanup() {
  echo "Cleaning up processes..."
  kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT

echo "Starting backend server..."
node src/server.js &

echo "Starting frontend Vite dev server..."
cd frontend && npm run dev -- --host &

echo "Waiting for servers to be ready..."
sleep 10

echo "Running Playwright tests..."
/home/jon/git/llm_server/venv/bin/python3 /home/jon/git/llm_server/test_frontend.py

echo "All processes finished."
