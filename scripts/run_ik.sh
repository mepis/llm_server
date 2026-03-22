#!/bin/bash

LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.115.205.84

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=graph
threads=16

###############
# Model Configs
###############

# best for nemotron model
context=262144
temp=0.6
topP=0.95
minP=0.00
topK=0.95

model=Qwen3.5-35B-A3B-UD-Q6_K_S.gguf

modelDir=/home/jon/.llm_server/models/
logsDir="${LLM_SERVER_HOME}logs"

cd "${LLM_SERVER_HOME}"
cd ik_llama.cpp/build/bin/

LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -m "${MODELS_DIR}${model}" --port $port --host $host -c $context -ngl 99 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min_p $minP --threads $threads --top-k $topK --log-file $logDir --parallel 2 -pps