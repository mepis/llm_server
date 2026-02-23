#!/bin/bash
################################################################################
# Build llama.cpp for CPU
# Optimized build for CPU-only systems
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

    if ! command -v gcc &> /dev/null; then
        missing_tools+=("gcc")
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Run: sudo ./scripts/install/install-dependencies.sh"
        exit 1
    fi

    log_info "All prerequisites met"
}

# Detect CPU features
detect_cpu_features() {
    log_info "Detecting CPU features..."

    CPU_CORES=$(nproc)
    CPU_MODEL=$(lscpu | grep "Model name" | cut -d':' -f2 | xargs)

    log_info "CPU: $CPU_MODEL"
    log_info "CPU Cores: $CPU_CORES"

    # Check for AVX support
    if grep -q avx2 /proc/cpuinfo; then
        HAS_AVX2=true
        log_info "AVX2 support: Yes"
    else
        HAS_AVX2=false
        log_info "AVX2 support: No"
    fi

    if grep -q avx512 /proc/cpuinfo; then
        HAS_AVX512=true
        log_info "AVX512 support: Yes"
    else
        HAS_AVX512=false
        log_info "AVX512 support: No"
    fi
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
    log_info "Configuring build with CMake..."

    cd "$BUILD_DIR"

    CMAKE_FLAGS=(
        "-DCMAKE_BUILD_TYPE=Release"
        "-DGGML_NATIVE=ON"
        "-DGGML_CPU=ON"
        "-DBUILD_SHARED_LIBS=OFF"
    )

    # Enable optimizations based on CPU features
    if [ "$HAS_AVX2" = true ]; then
        CMAKE_FLAGS+=("-DGGML_AVX2=ON")
    fi

    if [ "$HAS_AVX512" = true ]; then
        CMAKE_FLAGS+=("-DGGML_AVX512=ON")
    fi

    log_info "CMake flags: ${CMAKE_FLAGS[*]}"

    cmake "${CMAKE_FLAGS[@]}" .. || {
        log_error "CMake configuration failed"
        exit 1
    }

    log_info "Configuration complete"
}

# Build
build() {
    log_info "Building llama.cpp (this may take several minutes)..."

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
        else
            log_error "✗ $binary not found"
            all_found=false
        fi
    done

    if [ "$all_found" = false ]; then
        log_error "Build verification failed"
        exit 1
    fi

    log_info "All binaries built successfully"
}

# Main
main() {
    log_info "========================================="
    log_info "Building llama.cpp for CPU"
    log_info "========================================="

    check_prerequisites
    detect_cpu_features
    clean_build
    configure_build
    build
    verify_build

    log_info "========================================="
    log_info "Build completed successfully!"
    log_info "========================================="
    log_info ""
    log_info "Binaries location: $BUILD_DIR/bin/"
    log_info ""
    log_info "Available binaries:"
    log_info "  - llama-cli: Command-line interface"
    log_info "  - llama-server: HTTP server"
    log_info ""
    log_info "Next steps:"
    log_info "  1. Test: $BUILD_DIR/bin/llama-cli --help"
    log_info "  2. Run server: $BUILD_DIR/bin/llama-server"
}

main "$@"
