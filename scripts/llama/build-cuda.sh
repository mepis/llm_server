#!/bin/bash
################################################################################
# Build llama.cpp with CUDA Support
# Optimized build for NVIDIA GPU systems
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
BUILD_DIR="$LLAMA_DIR/build"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if llama.cpp exists
    if [ ! -d "$LLAMA_DIR" ]; then
        log_error "llama.cpp directory not found: $LLAMA_DIR"
        log_info "Run: ./scripts/llama/clone-llama.sh"
        exit 1
    fi

    # Check for required tools
    local missing_tools=()

    if ! command -v cmake &> /dev/null; then
        missing_tools+=("cmake")
    fi

    if ! command -v make &> /dev/null; then
        missing_tools+=("make")
    fi

    if ! command -v nvcc &> /dev/null; then
        log_error "CUDA toolkit (nvcc) not found"
        log_info "Run: sudo ./scripts/install/install-cuda.sh"
        exit 1
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Run: sudo ./scripts/install/install-dependencies.sh"
        exit 1
    fi

    log_info "All prerequisites met"
}

# Detect GPU
detect_gpu() {
    log_info "Detecting NVIDIA GPU..."

    if ! command -v nvidia-smi &> /dev/null; then
        log_error "nvidia-smi not found. Is the NVIDIA driver installed?"
        exit 1
    fi

    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader)
    CUDA_VERSION=$(nvcc --version | grep "release" | awk '{print $5}' | cut -d',' -f1)

    log_info "GPU: $GPU_INFO"
    log_info "CUDA Version: $CUDA_VERSION"

    CPU_CORES=$(nproc)
    log_info "CPU Cores: $CPU_CORES"
}

# Clean build directory
clean_build() {
    if [ -d "$BUILD_DIR" ]; then
        log_info "Cleaning previous build..."
        rm -rf "$BUILD_DIR"
    fi

    mkdir -p "$BUILD_DIR"
}

# Configure with CMake
configure_build() {
    log_info "Configuring build with CMake (CUDA enabled)..."

    cd "$BUILD_DIR"

    CMAKE_FLAGS=(
        "-DCMAKE_BUILD_TYPE=Release"
        "-DGGML_CUDA=ON"
        "-DGGML_NATIVE=ON"
        "-DBUILD_SHARED_LIBS=OFF"
    )

    log_info "CMake flags: ${CMAKE_FLAGS[*]}"

    cmake "${CMAKE_FLAGS[@]}" .. || {
        log_error "CMake configuration failed"
        exit 1
    }

    log_info "Configuration complete"
}

# Build
build() {
    log_info "Building llama.cpp with CUDA (this may take several minutes)..."

    cd "$BUILD_DIR"

    make -j"$CPU_CORES" || {
        log_error "Build failed"
        exit 1
    }

    log_info "Build complete"
}

# Verify build
verify_build() {
    log_info "Verifying build..."

    local binaries=("llama-cli" "llama-server")
    local all_found=true

    for binary in "${binaries[@]}"; do
        if [ -f "$BUILD_DIR/bin/$binary" ]; then
            log_info "✓ $binary"

            # Check if CUDA is linked
            if ldd "$BUILD_DIR/bin/$binary" | grep -q "cuda"; then
                log_info "  → CUDA support verified"
            else
                log_warn "  → CUDA libraries not detected in binary"
            fi
        else
            log_error "✗ $binary not found"
            all_found=false
        fi
    done

    if [ "$all_found" = false ]; then
        log_error "Build verification failed"
        exit 1
    fi

    log_info "All binaries built successfully with CUDA support"
}

# Main
main() {
    log_info "========================================="
    log_info "Building llama.cpp with CUDA Support"
    log_info "========================================="

    check_prerequisites
    detect_gpu
    clean_build
    configure_build
    build
    verify_build

    log_info "========================================="
    log_info "CUDA Build completed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Binaries location: $BUILD_DIR/bin/"
    log_info ""
    log_info "Available binaries:"
    log_info "  - llama-cli: Command-line interface with CUDA"
    log_info "  - llama-server: HTTP server with CUDA"
    log_info ""
    log_info "Environment variables for optimization:"
    log_info "  - GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 (use unified memory)"
    log_info "  - CUDA_VISIBLE_DEVICES=0 (select GPU)"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Test: $BUILD_DIR/bin/llama-cli --help"
    log_info "  2. Run server: $BUILD_DIR/bin/llama-server"
}

main "$@"
