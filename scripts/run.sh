#! /bin/bash

model=unsloth/Qwen3.5-35B-A3B-GGUF:UD-Q4_K_XL

threads=20

cd ..
cd llama.cpp
cd build
cd bin

export LLAMA_CACHE=/home/jon/git/llm_server/models

GGML_CUDA_PEER_MAX_BATCH_SIZE=1024 GGML_CUDA_FORCE_MMQ=true CUDA_SCALE_LAUNCH_QUEUES=2x GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -hf $model --port 3000 --host 100.115.205.84 -c 65536 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -b 2048 -ub 1024 -ctk q8_0 --threads $threads --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0 --webui --reasoning-budget 0 --cont-batching --kv-unified

