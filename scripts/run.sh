#! /bin/bash

model=unsloth/Nemotron-3-Nano-30B-A3B-GGUF:UD-Q4_K_XL


threads=10

cd ..
cd llama.cpp
cd build
cd bin

export LLAMA_CACHE=/home/jon/git/llm_server/models

GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-server -h $model --port 3000 --host 100.115.205.84 -c 65536 -ngl 99 --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -b 2048 -ub 1024 -ctk bf16 --threads $threads --webui # --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0  --reasoning-budget 0 --cont-batching --kv-unified --log-file $logDir

