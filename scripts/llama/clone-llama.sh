#!/bin/bash
################################################################################
# Clone llama.cpp Repository
# Clones the official llama.cpp repository from GitHub
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LLAMA_DIR="${LLAMA_CPP_DIR:-$PROJECT_ROOT/llama.cpp}"
LLAMA_REPO="https://github.com/ggml-org/llama.cpp.git"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        log_error "git is not installed. Please install git first."
        log_info "Run: sudo apt-get install git"
        exit 1
    fi
}

# Check if llama.cpp already exists
check_existing() {
    if [ -d "$LLAMA_DIR" ]; then
        log_warn "llama.cpp directory already exists: $LLAMA_DIR"
        read -p "Remove and re-clone? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Removing existing directory..."
            rm -rf "$LLAMA_DIR"
        else
            log_info "Skipping clone. Use existing directory."
            exit 0
        fi
    fi
}

# Clone repository
clone_repo() {
    log_info "Cloning llama.cpp repository..."
    log_info "Repository: $LLAMA_REPO"
    log_info "Destination: $LLAMA_DIR"

    git clone "$LLAMA_REPO" "$LLAMA_DIR" || {
        log_error "Failed to clone repository"
        exit 1
    }

    log_info "Repository cloned successfully"
}

# Get repository info
repo_info() {
    cd "$LLAMA_DIR"

    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_DATE=$(git log -1 --format=%cd --date=short)
    BRANCH=$(git rev-parse --abbrev-ref HEAD)

    log_info "Repository Information:"
    log_info "  Branch: $BRANCH"
    log_info "  Commit: $COMMIT_HASH"
    log_info "  Date: $COMMIT_DATE"
}

# Main
main() {
    log_info "========================================="
    log_info "Cloning llama.cpp Repository"
    log_info "========================================="

    check_git
    check_existing
    clone_repo
    repo_info

    log_info "========================================="
    log_info "Clone completed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Next steps:"
    log_info "  1. Build for CPU: ./scripts/llama/build-cpu.sh"
    log_info "  2. Build for CUDA: ./scripts/llama/build-cuda.sh"
    log_info "  3. Build for ROCm: ./scripts/llama/build-rocm.sh"
}

main "$@"
