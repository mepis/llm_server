#!/bin/bash
################################################################################
# Install Dependencies for LLM Server
# Installs required system packages for Ubuntu 24
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check OS version
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID

        log_info "Detected OS: $OS $VERSION"

        if [ "$OS" != "ubuntu" ]; then
            log_warn "This script is designed for Ubuntu 24. Your OS: $OS"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_error "Cannot detect OS version"
        exit 1
    fi
}

# Update package lists
update_packages() {
    log_info "Updating package lists..."
    apt-get update -qq || {
        log_error "Failed to update package lists"
        exit 1
    }
}

# Install build essentials
install_build_tools() {
    log_info "Installing build tools..."

    PACKAGES=(
        build-essential
        cmake
        git
        pkg-config
        curl
        wget
    )

    apt-get install -y "${PACKAGES[@]}" || {
        log_error "Failed to install build tools"
        exit 1
    }

    log_info "Build tools installed successfully"
}

# Install Python (for llama.cpp build scripts)
install_python() {
    log_info "Installing Python..."

    apt-get install -y python3 python3-pip || {
        log_error "Failed to install Python"
        exit 1
    }

    log_info "Python installed successfully"
    python3 --version
}

# Install Node.js dependencies (if needed)
install_nodejs_deps() {
    log_info "Checking Node.js..."

    if ! command -v node &> /dev/null; then
        log_warn "Node.js not found. Please install Node.js 18+ manually"
        log_info "Visit: https://nodejs.org/ or use nvm"
    else
        NODE_VERSION=$(node --version)
        log_info "Node.js version: $NODE_VERSION"
    fi
}

# Main installation
main() {
    log_info "========================================="
    log_info "LLM Server Dependency Installation"
    log_info "========================================="

    check_root
    check_os
    update_packages
    install_build_tools
    install_python
    install_nodejs_deps

    log_info "========================================="
    log_info "Basic dependencies installed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Next steps:"
    log_info "  1. For CUDA support, run: ./scripts/install/install-cuda.sh"
    log_info "  2. Clone llama.cpp: ./scripts/llama/clone-llama.sh"
    log_info "  3. Build llama.cpp: ./scripts/llama/build-*.sh"
}

main "$@"
