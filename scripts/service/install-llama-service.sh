#!/bin/bash
################################################################################
# Install llama-server systemd service
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LLAMA_DIR="${LLAMA_CPP_DIR:-$PROJECT_ROOT/llama.cpp}"
SERVICE_FILE="/etc/systemd/system/llama-server.service"
TEMPLATE_FILE="$SCRIPT_DIR/templates/llama-server.service"

# Check root
if [ "$EUID" -ne 0 ]; then
    log_error "Must run as root"
    exit 1
fi

# Check if llama-server binary exists
if [ ! -f "$LLAMA_DIR/build/bin/llama-server" ]; then
    log_error "llama-server binary not found: $LLAMA_DIR/build/bin/llama-server"
    log_info "Build llama.cpp first: ./scripts/llama/build-*.sh"
    exit 1
fi

# Get model path
MODEL_PATH="${1:-}"
if [ -z "$MODEL_PATH" ]; then
    log_warn "No model path specified"
    read -p "Enter model path (or leave empty to set later): " MODEL_PATH
    if [ -z "$MODEL_PATH" ]; then
        MODEL_PATH="/path/to/model.gguf"
    fi
fi

log_info "Installing llama-server service..."
log_info "Llama directory: $LLAMA_DIR"
log_info "Model path: $MODEL_PATH"

# Create service file
sed -e "s|__LLAMA_DIR__|$LLAMA_DIR|g" \
    -e "s|__MODEL_PATH__|$MODEL_PATH|g" \
    "$TEMPLATE_FILE" > "$SERVICE_FILE"

# Reload systemd
systemctl daemon-reload

log_info "Service installed: $SERVICE_FILE"
log_info ""
log_info "Commands:"
log_info "  Start:   systemctl start llama-server"
log_info "  Stop:    systemctl stop llama-server"
log_info "  Status:  systemctl status llama-server"
log_info "  Enable:  systemctl enable llama-server"
log_info "  Logs:    journalctl -u llama-server -f"
