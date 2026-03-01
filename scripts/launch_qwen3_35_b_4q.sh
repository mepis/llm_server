#! /bin/bash

export LLAMA_CACHE=/home/jon/llm_server/models

cd ~/llm_server/llama.cpp/build/bin/
GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -hf unsloth/Qwen3.5-35B-A3B-GGUF:UD-Q4_K_XL --port 3000 --host 100.115.205.84 -c 64000 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -n 2048 -b 1024 -ub 512 -ctk q4_0 --n-cpu-moe=0 --n-cpu-moe=0  --flash-attn=off --mlock --webui