#! /bin/bash

# model=AesSedai/Qwen3.5-35B-A3B-GGUF:Q4_K_M
# model=unsloth/Qwen3.5-27B-GGUF:Q4_K_S
# model=unsloth/Qwen3.5-35B-A3B-GGUF:UD-Q8_K_XL
model=/home/jon/git/llm_server/models/unsloth_Qwen3.5-35B-A3B-GGUF_Qwen3.5-35B-A3B-UD-Q4_K_XL.gguf
# model=unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL

threads=20

export LLAMA_CACHE=/home/jon/git/llm_server/models
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1
cd ..
cd llama.cpp
cd build
cd bin

# Multi GPU (3x - 16gb, 12gb, 12gb) w/ already downloaded model
~/llm_server/llama.cpp/build/bin/./llama-server -m $model --port 3000 --host 100.115.205.84 -c 131072 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -b 2048 -ub 1024 -ctk bf16 --threads $threads --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0 --webui --reasoning-budget 0 --parallel 4 --cont-batching --kv-unified

# Single GPU w/ higgingface import
# ~/git/llm_server/llama.cpp/build/bin/./llama-server -hf $model --port 3000 --host 127.0.0.1 -c 32768 -ngl 99 -b 1024 -ub 512 -ctk q8_0 --threads $threads --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0 --webui --reasoning-budget 0 --cont-batching --cache-ram 0 # --kv-unified 