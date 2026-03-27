#!/bin/bash

LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.115.205.84

# Hardware Configs
mainGpu=0
tensorSplit=3,2,2
splitMode=layer

###############
# Model Configs
###############

context=262144
temp=0.6
topP=0.95
minP=0.00
topK=0.95

modelDir=/home/jon/.llm_server/models/

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/

export CUDA_SCALE_LAUNCH_QUEUES=16x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 

./llama-server -m /home/jon/.llm_server/models/unsloth_Qwen3.5-35B-A3B-GGUF_Qwen3.5-35B-A3B-Q8_0.gguf --port $port --host $host -c $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --top-k $topK -ctk q8_0 --low-vram