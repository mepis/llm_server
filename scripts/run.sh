#! /bin/bash

# model=AesSedai/Qwen3.5-35B-A3B-GGUF:Q4_K_M
# model=unsloth/Qwen3.5-27B-GGUF:Q4_K_S
model=unsloth/Qwen3.5-35B-A3B-GGUF:UD-Q8_K_XL

export LLAMA_CACHE=/home/jon/llm_server/models
cd ..
cd llama.cpp
cd build
cd bin
GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -hf $model --port 3000 --host 100.115.205.84 -c 128000 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -b 1024 -ub 512 -ctk bf16 --flash-attn 0 --webui --reasoning-budget 0

