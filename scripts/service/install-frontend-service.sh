#!/bin/bash
################################################################################
# Install LLM frontend systemd service
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
SERVICE_FILE="/etc/systemd/system/llm-frontend.service"
TEMPLATE_FILE="$SCRIPT_DIR/templates/llm-frontend.service"

# Check root
if [ "$EUID" -ne 0 ]; then
    log_error "Must run as root"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    log_error "Node.js not found"
    exit 1
fi

log_info "Installing LLM frontend service..."
log_info "Project directory: $PROJECT_ROOT"
log_info "Node.js: $(node --version)"

# Create service file
sed -e "s|__PROJECT_DIR__|$PROJECT_ROOT|g" \
    "$TEMPLATE_FILE" > "$SERVICE_FILE"

# Reload systemd
systemctl daemon-reload

log_info "Service installed: $SERVICE_FILE"
log_info ""
log_info "Commands:"
log_info "  Start:   systemctl start llm-frontend"
log_info "  Stop:    systemctl stop llm-frontend"
log_info "  Status:  systemctl status llm-frontend"
log_info "  Enable:  systemctl enable llm-frontend"
log_info "  Logs:    journalctl -u llm-frontend -f"
