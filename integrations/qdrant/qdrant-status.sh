#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$ROOT_DIR/local_qdrant/.qdrant.pid"
LOG_FILE="$ROOT_DIR/local_qdrant/qdrant.log"

# Load .env if present
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

GRPC_PORT="${QDRANT_GRPC_PORT:-6334}"
HTTP_PORT="${QDRANT_HTTP_PORT:-6333}"

echo "=== Qdrant Status ==="
echo ""

# PID check
RUNNING=false
PID=""
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    RUNNING=true
  fi
fi

if $RUNNING; then
  echo "Status:  RUNNING"
  echo "PID:     $PID"
  echo "gRPC:    localhost:$GRPC_PORT"
  echo "HTTP:    localhost:$HTTP_PORT"
  echo ""

  # Health endpoint details
  HEALTH=$(curl -sf "http://localhost:$HTTP_PORT/health" 2>/dev/null || echo "{}")
  if [[ -n "$HEALTH" && "$HEALTH" != "{}" ]]; then
    VERSION=$(echo "$HEALTH" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || true)
    if [[ -n "$VERSION" ]]; then
      echo "Version: $VERSION"
    fi
  fi

  # Uptime from /info endpoint
  INFO=$(curl -sf "http://localhost:$HTTP_PORT/" 2>/dev/null || echo "")
  if [[ -n "$INFO" ]]; then
    FEAT=$(echo "$INFO" | grep -o '"feat":"[^"]*"' | cut -d'"' -f4 || true)
    if [[ -n "$FEAT" ]]; then
      echo "Feature: $FEAT"
    fi
  fi

else
  echo "Status:  STOPPED"
  if [[ -f "$PID_FILE" ]]; then
    echo "(stale PID file: $PID)"
  fi
fi

echo ""

# Port occupancy check
echo "Port check:"
if fuser "$GRPC_PORT/tcp" >/dev/null 2>&1; then
  echo "  gRPC ($GRPC_PORT): in use"
else
  echo "  gRPC ($GRPC_PORT): free"
fi

if fuser "$HTTP_PORT/tcp" >/dev/null 2>&1; then
  echo "  HTTP ($HTTP_PORT): in use"
else
  echo "  HTTP ($HTTP_PORT): free"
fi

echo ""

# Log file info
if [[ -f "$LOG_FILE" ]]; then
  LINES=$(wc -l < "$LOG_FILE")
  SIZE=$(du -h "$LOG_FILE" | cut -f1)
  echo "Log:     $LOG_FILE ($SIZE, $LINES lines)"
else
  echo "Log:     $LOG_FILE (not found)"
fi
