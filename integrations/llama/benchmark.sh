#!/bin/bash
# MODEL=Qwen3.6-35B-A3B-MXFP4_MOE.gguf
# MODEL=Qwen3.6-27B-Q8_0.gguf
MODEL=Nemotron-3-Nano-30B-A3B-Q8_0.gguf

# Benchmark configs
batch_size=512
ubatch_size=256

threads=19


# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=tensor

# Model Configs
context=262144

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

export CUDA_SCALE_LAUNCH_QUEUES=32x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)

## added for benchmarks
# export LLAMA_ARG_MLOCK=on
# export LLAMA_ARG_MMAP=off
export LLAMA_ARG_FIT=off
export LLAMA_PARAMS_FIT=off
# export LLAMA_ARG_FIT_TARGET=256
# export LLAMA_ARG_FIT_CTX=262144
# export LLAMA_ARG_FLASH_ATTN=1

./llama-bench -m $MODEL_DIR/$MODEL --fit off -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --threads $threads --cpu-strict 1 --batch-size $batch_size --ubatch-size $ubatch_size --fit-target 256 --fit-ctx 262144 

# --verbose