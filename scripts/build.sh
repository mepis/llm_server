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

# LLAMA OPTIONS
export GGML_CCACHE=OFF
export GGML_LTO=on
export GGML_RPC=on
export BUILD_SHARED_LIBS=on
export GGML_STATIC=on

# CPU OPTIONS
export GGML_CPU=off

# BLAS OPTIONS
export GGML_BLAS=off
# export GGML_BLAS_VENDOR=OpenBLAS 

# CUDA OPTIONS
# update nvcc path if needed
# which nvcc
export CUDACXX=/usr/local/cuda/bin/nvcc
export GGML_CUDA=on
export GGML_CUDA_PEER_MAX_BATCH_SIZE=256
export GGML_CUDA_COMPRESSION_MODE=balance
export GGML_CUDA_FORCE_MMQ=on
export GGML_CUDA_GRAPHS=on
export GGML_NATIVE=on

cmake -B build  
cmake --build build --config Release -j nproc