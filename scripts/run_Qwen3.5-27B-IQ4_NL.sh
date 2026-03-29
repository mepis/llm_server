#!/bin/bash

LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.115.205.84

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer
threads=8

###############
# Model Configs
###############

context=131072
temp=0.6
topP=0.95
minP=0.00
topK=20

modelDir=/home/jon/.llm_server/models/

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/

# export CUDA_SCALE_LAUNCH_QUEUES=8x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=/usr/local/cuda/bin/nvcc

./llama-server -m /home/jon/.llm_server/models/Qwen3.5-27B-IQ4_NL.gguf --port $port --host $host -c $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --top-k $topK --threads $threads --prio 3 --cpu-range 0-7 --cpu-strict 1 --swa-full --kv-unified --cache-type-k q4_0 --cache-type-v q4_0 --batch-size 4096 --ubatch-size 1024 --webui