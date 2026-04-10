#!/bin/bash

LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.120.132.78

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer
threads=4

###############
# Model Configs
###############

context=131072
temp=1.0
topP=0.95
minP=0.00
topK=64

modelDir=/home/jon/.llm_server/models/

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/

# export CUDA_SCALE_LAUNCH_QUEUES=8x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=/usr/local/cuda/bin/nvcc

./llama-server -m /home/jon/.llm_server/models/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q6_K_P.gguf --port $port --host $host -c $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --top-k $topK  --kv-unified --cache-type-k q8_0 --cache-type-v q8_0 --batch-size 2048 --ubatch-size 256 

# --threads $threads --prio 3 --cpu-range 0-7 --cpu-strict 1 --swa-full