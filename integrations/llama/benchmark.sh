#!/bin/bash

#----------------------------
# DOCS
#----------------------------
# NV patched kernels for Geforce cards: https://github.com/aikitoria/open-gpu-kernel-modules

#----------------------------
# MODEL CONFIGS
#----------------------------
MODEL=Qwen3.6-35B-A3B-Q8_0.gguf,Qwen3.6-27B-Q8_0.gguf
# MODEL=Qwen3.6-27B-Q8_0.gguf
# MODEL=Qwen3.6-35B-A3B-Q8_0.gguf

#----------------------------
# BENCHMARK CONFIGS
#----------------------------

# READ THE MANUAL BEFORE PLAYING WITH SETTINGS!!!

PROMPT_SIZE=128,256,512,1024,32768 # default=512
GEN_SIZE=128,256,512,1024,8192 # default=128
TEST_REPITITIONS=5 #default=5

MAIN_GPU=0
T_SPLIT=16,12,12
SPLIT_MODE=layer
LAYER_OFFLOAD=10,20,30,999
# NO_OFFLOAD=0,1 # default=0

# common contet size windows: 16384, 32768, 65536, 131072, 262144, 524288
FIT_MIN_CTX=16384,32768,65536,131072
FIT_TARGET=512,1024,2048
MEMORY_MAP=0,1

CPU_THREADS=2,4,8,10,16
CPU_STRICT=0,1
POLL_RATE=10,50,90 # default=50

BATCH_S=256,512,1024,2048,4096,8192
UBATCH_S=128,256,512,1024,2048

FLASH_ATTENTION=1
#----------------------------
# ENV VALS
#----------------------------
# llama-bench does not update these automatically while benchmarking. The benchmark must be restarted manually after changing these values

# CUDA_LAUNCH_QUEUE_SIZE=4x # Do not over do this, will cause memory issues and crash the system
CUDA_P2P=1 # requires patched drivers or data center GPUs, set to 0 for unpatched drivers with Geforce cards
CUDA_UNIFIED_MEMORY=1 # set to 0 for single GPU machines

#----------------------------
# BENCHMARK SCRIPT - DO NOT MODIFY UNLESS NEEDED, USE VARIABLES ABOVE
#----------------------------
export CUDA_SCALE_LAUNCH_QUEUES=$CUDA_LAUNCH_QUEUE_SIZE
export GGML_CUDA_P2P=$CUDA_P2P
export LLAMA_CACHE=$HOME/.llama_cache
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=$CUDA_UNIFIED_MEMORY
export CUDACXX=$(which nvcc)
export PATH=/opt/intel/oneapi/2025.2/bin${PATH:+:${PATH}}

MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)

source /opt/intel/oneapi/setvars.sh
systemctl --user stop llama.service

cd $CURRENT_DIR
cd llama.cpp/build/bin/
./llama-bench -m $MODEL_DIR/$MODEL -ngl $LAYER_OFFLOAD --split-mode $SPLIT_MODE --tensor-split $T_SPLIT --main-gpu $MAIN_GPU --poll $POLL_RATE --mmap $MEMORY_MAP --n-prompt $PROMPT_SIZE --n-gen $GEN_SIZE --repetitions $TEST_REPITITIONS --batch-size $BATCH_S --ubatch-size $UBATCH_S --fit-target $FIT_TARGET --fit-ctx 131072 --threads $CPU_THREADS --cpu-strict $CPU_STRICT --flash-attn $FLASH_ATTENTION --output csv > BENCHMAR_RESULTS.csv --output-err csv > BENCHMAR_ERRORS.csv

