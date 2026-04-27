#!/usr/bin/env bash
set -euo pipefail

QDRANT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_PATH="$QDRANT_DIR/qdrant/qdrant"
DATA_DIR="$QDRANT_DIR/data"
PID_FILE="$DATA_DIR/.qdrant.pid"
LOG_FILE="$DATA_DIR/qdrant.log"
STORAGE_PATH="$DATA_DIR/storage"

# Load .env if present
# Load .env from repo root if present
REPO_ROOT="$(cd "$QDRANT_DIR/.." && pwd)"
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
fi

GRPC_PORT="${QDRANT_GRPC_PORT:-6334}"
HTTP_PORT="${QDRANT_HTTP_PORT:-6333}"

is_running() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  # Fallback: check port
  if fuser "$GRPC_PORT/tcp" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# Check binary exists
if [[ ! -x "$BIN_PATH" ]]; then
  echo "Qdrant binary not found at $BIN_PATH"
  echo "Run: npm run qdrant:install"
  exit 1
fi

# Check if already running
EXISTING=$(is_running || true)
if [[ -n "$EXISTING" ]]; then
  echo "Qdrant is already running (PID: $EXISTING)"
  echo "  gRPC port: $GRPC_PORT"
  echo "  HTTP port: $HTTP_PORT"
  exit 0
fi

# Create data directory
mkdir -p "$DATA_DIR" "$STORAGE_PATH"

echo "Starting Qdrant server..."
echo "  Binary:    $BIN_PATH"
echo "  gRPC port: $GRPC_PORT"
echo "  HTTP port: $HTTP_PORT"
echo "  Storage:   $STORAGE_PATH"
echo "  Logs:      $LOG_FILE"

# Qdrant 1.12+ uses defaults (HTTP:6333, gRPC:6334, storage:./storage)
# Run from DATA_DIR so ./storage resolves to DATA_DIR/storage
# Start in background, redirect output to log
nohup bash -c "cd '$DATA_DIR' && exec '$BIN_PATH' --disable-telemetry" >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "Started with PID: $SERVER_PID"
echo ""

# Wait for server to be ready by polling HTTP health endpoint
echo "Waiting for Qdrant to be ready..."
TIMEOUT=30
ELAPSED=0
while (( ELAPSED < TIMEOUT )); do
  if curl -sf "http://localhost:$HTTP_PORT/healthz" >/dev/null 2>&1; then
    echo "Qdrant is ready! (took ${ELAPSED}s)"
    echo ""
    echo "Health check:"
    curl -sf "http://localhost:$HTTP_PORT/healthz" 2>/dev/null || true
    echo ""
    exit 0
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "ERROR: Qdrant did not become ready within ${TIMEOUT}s"
echo "Check logs: $LOG_FILE"
echo "PID file:   $PID_FILE"
exit 1
