#!/bin/bash
################################################################################
# Build llama.cpp with ROCm Support
# Optimized build for AMD GPU systems
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

    # Check for ROCm
    if [ ! -d "/opt/rocm" ]; then
        log_error "ROCm not found. Please install ROCm first."
        log_info "Visit: https://rocm.docs.amd.com/projects/install-on-linux/en/latest/"
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
    log_info "Detecting AMD GPU..."

    if command -v rocm-smi &> /dev/null; then
        GPU_INFO=$(rocm-smi --showproductname 2>/dev/null || echo "AMD GPU")
        log_info "GPU: $GPU_INFO"
    else
        log_warn "rocm-smi not found, assuming AMD GPU present"
    fi

    ROCM_VERSION=$(cat /opt/rocm/.info/version 2>/dev/null || echo "Unknown")
    log_info "ROCm Version: $ROCM_VERSION"

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
    log_info "Configuring build with CMake (ROCm enabled)..."

    cd "$BUILD_DIR"

    # Set ROCm paths
    export ROCM_PATH=/opt/rocm
    export HIP_PATH=/opt/rocm

    CMAKE_FLAGS=(
        "-DCMAKE_BUILD_TYPE=Release"
        "-DGGML_HIPBLAS=ON"
        "-DGGML_NATIVE=ON"
        "-DBUILD_SHARED_LIBS=OFF"
        "-DCMAKE_C_COMPILER=/opt/rocm/llvm/bin/clang"
        "-DCMAKE_CXX_COMPILER=/opt/rocm/llvm/bin/clang++"
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
    log_info "Building llama.cpp with ROCm (this may take several minutes)..."

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

            # Check if ROCm is linked
            if ldd "$BUILD_DIR/bin/$binary" | grep -q "hip"; then
                log_info "  → ROCm/HIP support verified"
            else
                log_warn "  → ROCm libraries not detected in binary"
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

    log_info "All binaries built successfully with ROCm support"
}

# Main
main() {
    log_info "========================================="
    log_info "Building llama.cpp with ROCm Support"
    log_info "========================================="

    check_prerequisites
    detect_gpu
    clean_build
    configure_build
    build
    verify_build

    log_info "========================================="
    log_info "ROCm Build completed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Binaries location: $BUILD_DIR/bin/"
    log_info ""
    log_info "Available binaries:"
    log_info "  - llama-cli: Command-line interface with ROCm"
    log_info "  - llama-server: HTTP server with ROCm"
    log_info ""
    log_info "Environment variables:"
    log_info "  - HIP_VISIBLE_DEVICES=0 (select GPU)"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Test: $BUILD_DIR/bin/llama-cli --help"
    log_info "  2. Run server: $BUILD_DIR/bin/llama-server"
}

main "$@"
