#! /bin/bash
export LLAMA_CACHE=/home/jon/llm_server/models
cd ..
cd llama.cpp
cd build
cd bin
GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -hf unsloth/Qwen3.5-27B-GGUF:Q4_K_S --port 3000 --host 100.115.205.84 -c 64000 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -b 1024 -ub 512 -ctk q4_0 --flash-attn 0 --webui --reasoning-budget 0


