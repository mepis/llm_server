#! /bin/bash

model=Tesslate/OmniCoder-9B-GGUF:Q6_K
host=100.75.103.12
context=65536
port=3031

threads=10

cd ..
cd llama.cpp
cd build
cd bin


cd  ~/git/llm_server/llama.cpp/build/bin/
export LLAMA_CACHE=/home/jon/git/llm_server/models

CUDA_SCALE_LAUNCH_QUEUES=4x GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ./llama-server -hf $model --port $port --host $host -c $context -ngl 99 -b 1024 -ub 512 -ctk q4_0 --threads $threads --temp 0.7 --repeat-penalty 1.0 --presence-penalty 1.5 --top-p 0.8 --min-p 0.0 --flash-attn 0 --reasoning-budget 0 --cont-batching --kv-unified
