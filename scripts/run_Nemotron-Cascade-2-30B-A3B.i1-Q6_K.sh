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
threadPriority=3

###############
# Model Configs
###############

context=131072
temp=0.6
topP=0.95
minP=0.00
topK=0.95

modelDir=/home/jon/.llm_server/models/

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/

CUDA_SCALE_LAUNCH_QUEUES=2x LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -m /home/jon/.llm_server/models/Nemotron-Cascade-2-30B-A3B.i1-Q6_K.gguf --port $port --host $host -c $context -ngl 99 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --threads $threads --top-k $topK --prio $threadPriority -ctk iq4_nl --flash-attn on


