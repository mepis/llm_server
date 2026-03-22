#!/bin/bash


LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.115.205.84

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer
threads=26

###############
# Model Configs
###############

# best for nemotron model
context=262144
temp=0.6
topP=0.95
prio=3
minP=0.00
topK=0.95

modelDir=/home/jon/.llm_server/models/

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/

LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -hf unsloth/Qwen3.5-35B-A3B-GGUF:Q8_0 --port $port --host $host -c $context -ngl 99 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --prio $prio --min_p $minP --threads $threads --top-k $topK -ctk q8_0 --kv-unified