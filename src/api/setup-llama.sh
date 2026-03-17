#!/usr/bin/env bash
# setup-llama.sh - Ensure llama.cpp is present and built

set -euo pipefail

# Determine script directory (where this script resides)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMA_DIR="${SCRIPT_DIR}/llama.cpp"

# If llama.cpp directory does not exist, clone it
if [ ! -d "${LAMA_DIR}" ]; then
    echo "Cloning llama.cpp repository..."
    git clone https://github.com/ggml-org/llama.cpp.git "${LAMA_DIR}"
else
    echo "llama.cpp already exists, pulling latest changes..."
    cd "${LAMA_DIR}"
    git fetch --quiet
    git pull --quiet
    cd -
fi

# Build llama.cpp
echo "Building llama.cpp..."
cd "${LAMA_DIR}"
mkdir -p build
cd build
cmake .. -DLLAMA_BUILD=ON -DCMAKE_POSITION_INDEPENDENT_CODE=ON
make -j
echo "Build complete."