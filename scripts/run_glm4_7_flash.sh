#! /bin/bash

export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1
export GGML_CUDA_FORCE_MMQ=1
export GGML_CUDA_PEER_MAX_BATCH_SIZE=256
export CUDA_SCALE_LAUNCH_QUEUES=2x
export LLAMA_ARG_SPLIT_MODE=row

cd ..
cd llama.cpp/build/bin

./llama-server -hf  unsloth/GLM-4.7-Flash-GGUF:Q4_K_M --port 8080 --host 100.102.215.14  --ctx-size 64000 --perf  --cache-type-k q4_0  --cache-type-v q4_0 --mmap --gpu-layers 99 --main-gpu 0 --direct-io --mlock --tensor-split 16,12,12 --spec-type ngram-cache

