#! /bin/bash

model=unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL

threads=10

cd ..
cd llama.cpp
cd build
cd bin


cd  ~/git/llm_server/llama.cpp/build/bin/
export LLAMA_CACHE=/home/jon/git/llm_server/models

CUDA_SCALE_LAUNCH_QUEUES=4x GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -hf $model --port 3000 --host 100.120.235.11 -c 32768 -ngl 99 -b 2048 -ub 512 -ctk q4_0 --threads $threads --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0 --reasoning-budget 0 --cont-batching --kv-unified
