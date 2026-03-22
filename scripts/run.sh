#!/bin/bash


LLM_SERVER_HOME=/home/jon/.llm_server/

# Host Configs
port=11434
host=100.115.205.84

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer
threads=16
threatPriority=2

###############
# Model Configs
###############

# best for nemotron model
context=262144
temp=0.6
topP=0.95
minP=0.00
topK=0.95

#model=Tesslate_OmniCoder-9B-GGUF_omnicoder-9b-q6_k.gguf
# model=unsloth_Qwen3-Coder-30B-A3B-Instruct-GGUF_Qwen3-Coder-30B-A3B-Instruct-UD-Q6_K_XL.gguf
# model=unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:UD-Q6_K_XL
# model=Tesslate/OmniCoder-9B-GGUF:Q8_0
# model=Tesslate_OmniCoder-9B-GGUF_omnicoder-9b-q8_0.gguf
# model=unsloth/GLM-4.7-Flash-GGUF:Q8_0
# model=unsloth_Nemotron-3-Nano-30B-A3B-GGUF_Nemotron-3-Nano-30B-A3B-UD-Q4_K_XL.gguf 
model=Qwen3.5-35B-A3B-UD-Q6_K_S.gguf

modelDir=/home/jon/.llm_server/models/
logsDir="${LLM_SERVER_HOME}logs"

cd "${LLM_SERVER_HOME}"
cd llama.cpp/build/bin/


# Tesslate/OmniCoder-9B-GGUF:Q8_0
# LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ${LLAMA_SERVER_BIN} -hf $model --port 3000 --host 100.115.205.84 -c 262144 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --webui --temp 0.6 --top-p 0.95 --cont-batching -np 4 -b 2048 -ub 1024 -ctk q8_0 --kv-unified # --repeat-penalty 1.0 --presence-penalty 1.5 --min-p 0.0  --threads $threads --flash-attn 0  --reasoning-budget 0 --log-file $logDir


# unsloth/GLM-4.7-Flash-GGUF:Q8_0
# LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ${LLAMA_SERVER_BIN} -hf $model --port 3000 --host 100.115.205.84 -c 202752 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --temp 0.7 --top-p 1.0 --cont-batching --repeat-penalty 1.0 --min-p 0.01 -b 2048 -ub 1024 -ctk q8_0 --kv-unified #  --presence-penalty 1.5 --min-p 0.0  --threads $threads --flash-attn 0  --reasoning-budget 0 --log-file $logDir -np 4



LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -m /home/jon/.llm_server/models/Qwen3.5-35B-A3B-UD-Q6_K_S.gguf --port $port --host $host -c $context -ngl 99 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching  --min_p $minP --threads $threads --top-k $topK --kv-unified --log-file $logDir --kv-unified -np 8 -b 1024 --swa-full -dio --mmap --prio $threatPriority