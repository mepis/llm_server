#!/bin/bash
model=Qwen3.6-35B-A3B-MXFP4_MOE.gguf

# Benchmark configs
batch_size=256
ubatch_size=256

threads=19


# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer

# Model Configs
context=262144

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

export CUDA_SCALE_LAUNCH_QUEUES=24x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)

## added for benchmarks
export LLAMA_ARG_MLOCK=on
export LLAMA_ARG_MMAP=off
export LLAMA_ARG_FIT=on
export LLAMA_ARG_FIT_TARGET=256
export LLAMA_ARG_FIT_CTX=262144
export LLAMA_ARG_FLASH_ATTN=1

./llama-bench -m $MODEL_DIR/$model -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --threads $threads --cpu-strict 1 --batch-size $batch_size --ubatch-size $ubatch_size --fit-target 256 --fit-ctx 262144 -r 25 --verbose

# --verbose