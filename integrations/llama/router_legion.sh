#!/bin/bash
export CUDA_SCALE_LAUNCH_QUEUES=32x 
export LLAMA_CACHE=$HOME/.llm_models
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)
export LLAMA_ARG_FIT=on
export LLAMA_ARG_FIT_TARGET=512
export LLAMA_ARG_FIT_CTX=262144

# Host Configs
port=11434
host=100.78.136.115

# Hardware Configs
mainGpu=1
tensorSplit=8
splitMode=layer
threads=22
PARALLEL=6

# Model Configs
context=262144
temp=0.7
topP=0.95
minP=0.00
topK=20
BATCH=256
UBATCH=256

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

./llama-server --models-dir $MODEL_DIR --models-autoload --models-max 2 --sleep-idle-seconds 30 --port $port --host $host -c $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --top-k $topK --threads $threads --kv-unified --cache-type-k q8_0 --cache-type-v q8_0 --batch-size $BATCH --ubatch-size $UBATCH --chat-template-kwargs '{"enable_thinking":true}' --parallel $PARALLEL --reasoning on --verbose --flash-attn 1 --repeat-penalty 1.0 --presence-penalty 1.0 --jinja

# --repeat-penalty 1.0 --presence-penalty 1.5 (1.0 - 1.5)  Use if looping is a problem