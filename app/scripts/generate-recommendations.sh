#!/bin/bash
# Hardware Detection and Recommendations Script
# Runs hardware detection and outputs JSON recommendations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT_SCRIPT="${SCRIPT_DIR}/detect-hardware.sh"

# Run hardware detection and capture output
DETECT_OUTPUT=$("$DETECT_SCRIPT" 2>&1)

# Parse the detection output
CPU_CORES=$(nproc 2>/dev/null || echo "4")
CPU_MODEL=$(grep 'model name' /proc/cpuinfo 2>/dev/null | head -1 | cut -d: -f2 | xargs || echo "Unknown")
RAM_GB=$(( $(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}') / 1024 / 1024 ))
HAS_CUDA="false"
GPU_COUNT=0
TOTAL_VRAM_MB=0

if command -v nvidia-smi &> /dev/null; then
    HAS_CUDA="true"
    GPU_COUNT=$(nvidia-smi --list-gpus 2>/dev/null | wc -l)
    TOTAL_VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | awk '{sum+=$1} END {print sum}')
fi

# Calculate recommendations based on hardware
if [ "$HAS_CUDA" = "true" ] && [ "$GPU_COUNT" -gt 0 ]; then
    # GPU detected
    if [ "$GPU_COUNT" -eq 1 ]; then
        GPU_LAYERS="all"
        TENSOR_SPLIT=""
        SPLIT_MODE="none"
        BUILD_SHARED_LIBS="false"
        GGML_CUDA="true"
        GGML_CUDA_PEER_MAX_BATCH_SIZE="256"
        GGML_CUDA_FA="true"
        GGML_CUDA_GRAPHS="true"
        CONTEXT_SIZE="4096"
    elif [ "$GPU_COUNT" -eq 2 ]; then
        GPU_LAYERS="all"
        TENSOR_SPLIT="1,1"
        SPLIT_MODE="layer"
        BUILD_SHARED_LIBS="false"
        GGML_CUDA="true"
        GGML_CUDA_PEER_MAX_BATCH_SIZE="512"
        GGML_CUDA_FA="true"
        GGML_CUDA_GRAPHS="true"
        CONTEXT_SIZE="8192"
    elif [ "$GPU_COUNT" -eq 3 ]; then
        GPU_LAYERS="all"
        TENSOR_SPLIT="1,1,1"
        SPLIT_MODE="layer"
        BUILD_SHARED_LIBS="false"
        GGML_CUDA="true"
        GGML_CUDA_PEER_MAX_BATCH_SIZE="512"
        GGML_CUDA_FA="true"
        GGML_CUDA_GRAPHS="true"
        CONTEXT_SIZE="8192"
    else
        GPU_LAYERS="all"
        TENSOR_SPLIT="1,1,1,1"
        SPLIT_MODE="layer"
        BUILD_SHARED_LIBS="false"
        GGML_CUDA="true"
        GGML_CUDA_PEER_MAX_BATCH_SIZE="512"
        GGML_CUDA_FA="true"
        GGML_CUDA_GRAPHS="true"
        CONTEXT_SIZE="131072"
    fi
    
    # Adjust context size based on total VRAM
    if [ "$TOTAL_VRAM_MB" -gt 40000 ]; then
        CONTEXT_SIZE="131072"
    elif [ "$TOTAL_VRAM_MB" -gt 24000 ]; then
        CONTEXT_SIZE="8192"
    elif [ "$TOTAL_VRAM_MB" -gt 12000 ]; then
        CONTEXT_SIZE="4096"
    fi
else
    # CPU-only mode
    GPU_LAYERS="0"
    TENSOR_SPLIT=""
    SPLIT_MODE="none"
    BUILD_SHARED_LIBS="false"
    GGML_CUDA="false"
    GGML_CUDA_PEER_MAX_BATCH_SIZE=""
    GGML_CUDA_FA="false"
    GGML_CUDA_GRAPHS="false"
    GGML_BLAS="true"
    GGML_BLAS_VENDOR="OpenBLAS"
    CONTEXT_SIZE="2048"
fi

# Adjust thread count based on CPU cores
if [ "$CPU_CORES" -gt 32 ]; then
    THREADS="16"
    BATCH_SIZE="1024"
elif [ "$CPU_CORES" -gt 16 ]; then
    THREADS="8"
    BATCH_SIZE="512"
else
    THREADS="4"
    BATCH_SIZE="256"
fi

# Adjust context size based on RAM
if [ "$RAM_GB" -gt 64 ]; then
    CONTEXT_SIZE="131072"
elif [ "$RAM_GB" -gt 32 ]; then
    CONTEXT_SIZE="8192"
elif [ "$RAM_GB" -lt 8 ]; then
    CONTEXT_SIZE="1024"
fi

# Generate recommendations text
if [ "$HAS_CUDA" = "true" ] && [ "$GPU_COUNT" -gt 0 ]; then
    RECOMMENDATIONS_TEXT="=== Hardware Recommendations for llama.cpp ===

GPU Configuration:
- Use GPU acceleration with CUDA
- GPU Layers: $GPU_LAYERS (all layers on GPU)
- Context Size: $CONTEXT_SIZE tokens

Build Settings:
- Enable CUDA backend with Flash Attention
- Enable CUDA graphs for better performance
- Use Release build type with LTO

General Settings:
- Threads: $THREADS (optimized for your CPU)
- Batch Size: $BATCH_SIZE
- Temperature: 0.7 (balanced creativity)
- Top-K: 40, Top-P: 0.95 (balanced sampling)
- Enable continuous batching for better throughput"
else
    RECOMMENDATIONS_TEXT="=== Hardware Recommendations for llama.cpp ===

CPU Configuration:
- Use CPU-only mode (BLAS acceleration)
- GPU Layers: 0 (CPU inference)
- Context Size: $CONTEXT_SIZE tokens

Build Settings:
- Enable BLAS backend with OpenBLAS
- Use Release build type with LTO
- Consider using -DGGML_OPENMP=ON for multi-threading

General Settings:
- Threads: $THREADS (optimized for your CPU)
- Batch Size: $BATCH_SIZE
- Temperature: 0.7 (balanced creativity)
- Top-K: 40, Top-P: 0.95 (balanced sampling)
- Enable continuous batching for better throughput"
fi

# Escape recommendations text for JSON
ESCAPED_TEXT=$(echo "$RECOMMENDATIONS_TEXT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' '\r' | sed 's/\r/\\n/g')

# Output JSON
cat <<EOF
{
  "detection": {
    "cpu_cores": $CPU_CORES,
    "cpu_model": "$(echo "$CPU_MODEL" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')",
    "ram_gb": $RAM_GB,
    "has_cuda": $HAS_CUDA,
    "gpu_count": $GPU_COUNT,
    "total_vram_mb": $TOTAL_VRAM_MB
  },
  "build_recommendations": {
    "buildSharedLibs": $BUILD_SHARED_LIBS,
    "cmakeBuildType": "Release",
    "ggmlCcache": true,
    "ggmlLto": true,
    "ggmlNative": true,
    "ggmlCuda": $GGML_CUDA,
    "ggmlCudaPeerMaxBatchSize": ${GGML_CUDA_PEER_MAX_BATCH_SIZE:-""},
    "ggmlCudaFa": $GGML_CUDA_FA,
    "ggmlCudaGraphs": $GGML_CUDA_GRAPHS,
    "ggmlBlast": ${GGML_BLAS:-false},
    "ggmlBlastVendor": "${GGML_BLAS_VENDOR:-OpenBLAS}"
  },
  "run_recommendations": {
    "gpuLayers": "$GPU_LAYERS",
    "splitMode": "$SPLIT_MODE",
    "tensorSplit": "$TENSOR_SPLIT",
    "contextSize": $CONTEXT_SIZE,
    "threads": $THREADS,
    "batchSize": $BATCH_SIZE,
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "contBatching": true
  },
  "recommendations_text": "$ESCAPED_TEXT"
}
EOF
