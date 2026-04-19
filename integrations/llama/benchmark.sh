#!/bin/bash
model=Qwen3.6-35B-A3B-MXFP4_MOE.gguf

# Benchmark configs
fit=off,on
threads=8
batch_size=2048-4096+512
ubatch_size=256-4096+256
mlock=0,1
mmap=0,1

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

# export CUDA_SCALE_LAUNCH_QUEUES=8x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)

./llama-bench -m $MODEL_DIR/$model --fit-ctx $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --threads $threads --prio 2 --cpu-strict 1  --cache-type-k q8_0 --cache-type-v q8_0 --batch-size $batch --ubatch-size $ubatch_size --chat-template-kwargs '{"enable_thinking":true}' --presence-penalty 0.0 --repeat-penalty 1.0 --fit $fit --mlock $mlock --mmap $mmap --direct-io 0 --fit-target 256