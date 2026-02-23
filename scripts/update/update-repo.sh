#!/bin/bash
################################################################################
# Update Repository and Rebuild
# Pulls latest changes, updates dependencies, builds frontend
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

cd "$PROJECT_ROOT"

log_info "========================================="
log_info "Updating LLM Server Repository"
log_info "========================================="

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
log_info "Current commit: $CURRENT_COMMIT"

# Pull latest changes
log_info "Pulling latest changes..."
git pull origin main || {
    log_error "Failed to pull changes"
    exit 1
}

NEW_COMMIT=$(git rev-parse HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log_info "Already up to date"
    exit 0
fi

log_info "Updated to commit: $NEW_COMMIT"

# Check if package.json changed
if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "package.json"; then
    log_info "package.json changed, updating dependencies..."
    npm install
fi

# Check if frontend changed
if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "web/"; then
    log_info "Frontend changed, rebuilding..."
    if [ -d "web" ]; then
        cd web && npm install && npm run build
        cd "$PROJECT_ROOT"
    fi
fi

# Check if .env.example changed
if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q ".env.example"; then
    log_warn ".env.example changed - review your .env file"
fi

# Restart services if running
if systemctl is-active --quiet llm-frontend; then
    log_info "Restarting llm-frontend service..."
    systemctl restart llm-frontend
fi

log_info "========================================="
log_info "Update completed successfully!"
log_info "========================================="
