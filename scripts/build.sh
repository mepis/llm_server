#!/bin/bash

LLM_SERVER_HOME=~/.llm_server

cudav="86;120"

cd ..
cd integrations
git clone https://github.com/ggml-org/llama.cpp 
cd llama.cpp
git pull

cd $LLM_SERVER_HOME
git clone https://github.com/ggml-org/llama.cpp 
cd llama.cpp
git pull
rm -r build

# CUDA OPTIONS
# update nvcc path if needed
# which nvcc
export CUDACXX=/usr/local/cuda/bin/nvcc


cmake -B build -DGGML_CCACHE=OFF -DGGML_LTO=on -DGGML_RPC=on -DBUILD_SHARED_LIBS=off -DGGML_STATIC=on -DGGML_CUDA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=256 -DGGML_CUDA_COMPRESSION_MODE=balance -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_GRAPHS=on -DGGML_NATIVE=on -DGGML_BLAS=off -DGGML_CPU=off
cmake --build build --config Release -j "${nproc}"