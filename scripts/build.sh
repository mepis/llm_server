#!/bin/bash

LLM_SERVER_HOME=~/.llm_server

cudav="86;89"
cudaBatchSize=512


# update nvcc path if needed
# which nvcc
export CUDACXX=/usr/local/cuda/bin/nvcc

export GGML_CCACHE=OFF

cd $LLM_SERVER_HOME
git clone https://github.com/ggml-org/llama.cpp 
cd llama.cpp
git pull
rm -r build
cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DGGML_CUDA_PEER_MAX_BATCH_SIZE=$cudaBatchSize -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS 
cmake --build build --config Release -j 10

# -DCMAKE_CUDA_ARCHITECTURES=$cudav 
# -DGGML_NATIVE=OFF 