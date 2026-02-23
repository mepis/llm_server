#!/bin/bash
################################################################################
# Monitor Repository for Updates
# Checks for new commits and triggers update script
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHECK_INTERVAL="${UPDATE_CHECK_INTERVAL:-300}"  # 5 minutes default

cd "$PROJECT_ROOT"

log_info "Starting update monitor..."
log_info "Check interval: ${CHECK_INTERVAL}s"

while true; do
    # Fetch latest changes
    git fetch origin main &> /dev/null

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" != "$REMOTE" ]; then
        log_info "New commits detected!"
        log_info "Local: $LOCAL"
        log_info "Remote: $REMOTE"

        # Run update script
        if [ -f "$SCRIPT_DIR/update-repo.sh" ]; then
            log_info "Running update script..."
            bash "$SCRIPT_DIR/update-repo.sh" || {
                log_error "Update failed"
            }
        fi
    fi

    sleep "$CHECK_INTERVAL"
done
