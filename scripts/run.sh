#! /bin/bash

# model=unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:UD-Q6_K_XL
# model=Tesslate/OmniCoder-9B-GGUF:Q8_0
# model=unsloth/GLM-4.7-Flash-GGUF:Q8_0
model=unsloth_Nemotron-3-Nano-30B-A3B-GGUF_Nemotron-3-Nano-30B-A3B-UD-Q4_K_XL.gguf
modelDir=~/llm_server/models


threads=16

cd ..
cd llama.cpp
cd build
cd bin

 
# Tesslate/OmniCoder-9B-GGUF:Q8_0
# LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -hf $model --port 3000 --host 100.115.205.84 -c 262144 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --webui --temp 0.6 --top-p 0.95 --cont-batching -np 4 -b 2048 -ub 1024 -ctk q8_0 --kv-unified # --repeat-penalty 1.0 --presence-penalty 1.5 --min-p 0.0  --threads $threads --flash-attn 0  --reasoning-budget 0 --log-file $logDir

# unsloth/GLM-4.7-Flash-GGUF:Q8_0
# LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -hf $model --port 3000 --host 100.115.205.84 -c 202752 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --temp 0.7 --top-p 1.0 --cont-batching --repeat-penalty 1.0 --min-p 0.01 -b 2048 -ub 1024 -ctk q8_0 --kv-unified #  --presence-penalty 1.5 --min-p 0.0  --threads $threads --flash-attn 0  --reasoning-budget 0 --log-file $logDir -np 4

LLAMA_CACHE=$modelDir GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -m $model --port 3000 --host 100.115.205.84 -c 262144 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --temp 0.6 --top-p 0.95 --cont-batching --prio 3 --min_p 0.01