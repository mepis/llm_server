#!/bin/bash
# MODEL=Qwen3.6-35B-A3B-MXFP4_MOE.gguf
# MODEL=Qwen3.6-27B-Q8_0.gguf
MODEL=Nemotron-3-Nano-30B-A3B-Q8_0.gguf

# Benchmark configs
batch_size=512
ubatch_size=256

threads=8


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

export CUDA_SCALE_LAUNCH_QUEUES=16x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)

## added for benchmarks
export LLAMA_ARG_MLOCK=on
export LLAMA_ARG_SWA_FULL=on
export LLAMA_ARG_MMAP=off
export LLAMA_ARG_FIT=on
export LLAMA_ARG_FIT_TARGET=256
export LLAMA_ARG_FIT_CTX=262144
export LLAMA_ARG_FLASH_ATTN=1
export LLAMA_ARG_CONT_BATCHING=on
export LLAMA_ARG_N_PREDICT=0
export LLAMA_ARG_N_PARALLEL=6

./llama-bench -m $MODEL_DIR/$MODEL -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --batch-size $batch_size --ubatch-size $ubatch_size --threads $threads --mmap 0  --parallel 6 --sequences 2

# --verbose --mlock 1  --fit on --fit-target 512 --fit-ctx 262144 --swa-full --cont-batching --parallel 6 --sequences 2