#!/bin/bash
MODEL=NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-MXFP4_MOE.gguf

# Host Configs
PORT=11434
HOST=100.115.205.84

# Hardware Configs
THREADS=8
CPU_STRICT=1
CPU_RANGE=0-7
PARALLEL=1

# Model Configs
CONTEXT=65536
TEMP=0.6
TOP_P=0.95
MIN_P=0.00
TOP_K=20
REASONING=on
FA=on
BATCH=265
UBATCH=256
PRESENCE_PENALTY=1.0

# valid values: q8_0, q4_0, q4_1, q5_0, q5_1, iq4_nl
K_CACHE_TYPE=q8_0
V_CACHE_TYPE=q8_0

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

# export LLAMA_ARG_MLOCK=on
# export CUDA_SCALE_LAUNCH_QUEUES=16x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)
export PATH=/opt/intel/oneapi/2025.2/bin:/opt/intel/oneapi/compiler/latest/lib/${PATH:+:${PATH}}
source /opt/intel/oneapi/setvars.sh

# export LLAMA_ARG_FIT=on
# export LLAMA_ARG_FIT_TARGET=512

./llama-server --model $MODEL_DIR/$model --mmproj $MODEL_DIR/$MODEL --alias $MODEL --port $PORT --host $HOST -c $CONTEXT -ngl 20 --temp $TEMP --top-p $TOP_P --cont-batching --min-p $MIN_P --kv-unified  --parallel $PARALLEL  --batch-size $BATCH --ubatch-size $UBATCH --threads $THREADS --cpu-strict $CPU_STRICT --cpu-range $CPU_RANGE --cpu-strict-batch $CPU_STRICT --threads-batch $THREADS --presence-penalty $PRESENCE_PENALTY --reasoning $REASONING -fa $FA  --cache-type-k $K_CACHE_TYPE --cache-type-v $V_CACHE_TYPE

# --top-k $TOP_K 