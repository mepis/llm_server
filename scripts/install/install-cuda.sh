#!/bin/bash
################################################################################
# Install CUDA Toolkit for NVIDIA GPU Support
# For Ubuntu 24
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

# Detect NVIDIA GPU
detect_nvidia() {
    log_info "Detecting NVIDIA GPU..."

    if ! lspci | grep -i nvidia &> /dev/null; then
        log_error "No NVIDIA GPU detected"
        log_info "This script is only for systems with NVIDIA GPUs"
        exit 1
    fi

    log_info "NVIDIA GPU detected:"
    lspci | grep -i nvidia
}

# Check if CUDA is already installed
check_existing_cuda() {
    if command -v nvcc &> /dev/null; then
        CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $5}' | cut -d',' -f1)
        log_warn "CUDA is already installed: $CUDA_VERSION"
        read -p "Reinstall/Update CUDA? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping CUDA installation"
            exit 0
        fi
    fi
}

# Install CUDA Toolkit
install_cuda() {
    log_info "Installing CUDA Toolkit..."

    # Add NVIDIA package repository
    log_info "Adding NVIDIA repository..."
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb
    dpkg -i cuda-keyring_1.1-1_all.deb
    rm cuda-keyring_1.1-1_all.deb

    apt-get update -qq

    # Install CUDA toolkit
    log_info "Installing CUDA toolkit (this may take a while)..."
    apt-get install -y cuda-toolkit || {
        log_error "Failed to install CUDA toolkit"
        exit 1
    }

    # Add CUDA to PATH
    log_info "Configuring environment..."
    if ! grep -q "/usr/local/cuda/bin" /etc/environment; then
        echo 'PATH="/usr/local/cuda/bin:$PATH"' >> /etc/environment
        echo 'export LD_LIBRARY_PATH="/usr/local/cuda/lib64:$LD_LIBRARY_PATH"' >> /etc/profile.d/cuda.sh
    fi

    log_info "CUDA Toolkit installed successfully"
}

# Verify installation
verify_cuda() {
    log_info "Verifying CUDA installation..."

    export PATH="/usr/local/cuda/bin:$PATH"

    if command -v nvcc &> /dev/null; then
        log_info "CUDA Version:"
        nvcc --version

        if command -v nvidia-smi &> /dev/null; then
            log_info "GPU Information:"
            nvidia-smi
        fi
    else
        log_error "CUDA installation verification failed"
        exit 1
    fi
}

# Main installation
main() {
    log_info "========================================="
    log_info "CUDA Toolkit Installation"
    log_info "========================================="

    check_root
    detect_nvidia
    check_existing_cuda
    install_cuda
    verify_cuda

    log_info "========================================="
    log_info "CUDA Toolkit installed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Note: You may need to log out and back in for PATH changes to take effect"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Build llama.cpp with CUDA: ./scripts/llama/build-cuda.sh"
}

main "$@"
