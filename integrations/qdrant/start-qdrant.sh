#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_PATH="$ROOT_DIR/qdrant/qdrant/qdrant"
DATA_DIR="$ROOT_DIR/local_qdrant"
PID_FILE="$DATA_DIR/.qdrant.pid"
LOG_FILE="$DATA_DIR/qdrant.log"
STORAGE_PATH="$DATA_DIR/storage"

# Load .env if present
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
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

# Build command arguments
ARGS=(server --grpc-port "$GRPC_PORT" --http-port "$HTTP_PORT" --storage-path "$STORAGE_PATH")

# Add API key if set
if [[ -n "${QDRANT_API_KEY:-}" ]]; then
  ARGS+=(--api-key "$QDRANT_API_KEY")
fi

# Start in background, redirect output to log
nohup "$BIN_PATH" "${ARGS[@]}" >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "Started with PID: $SERVER_PID"
echo ""

# Wait for server to be ready by polling HTTP health endpoint
echo "Waiting for Qdrant to be ready..."
TIMEOUT=30
ELAPSED=0
while (( ELAPSED < TIMEOUT )); do
  if curl -sf "http://localhost:$HTTP_PORT/health" >/dev/null 2>&1; then
    echo "Qdrant is ready! (took ${ELAPSED}s)"
    echo ""
    echo "Health check:"
    curl -sf "http://localhost:$HTTP_PORT/health" 2>/dev/null || true
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
