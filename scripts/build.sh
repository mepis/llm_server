#! /bin/bash

cudav="86;89"
cudaBatchSize=64

cd ~/git/llm_server/
git clone https://github.com/ggml-org/llama.cpp

export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export GGML_CCACHE=ON

# update nvcc path if needed
# which nvcc
# export CUDACXX=/usr/bin/nvcc

cd ..
cd ~/git/llm_server/llama.cpp  
rm -r build
cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DGGML_NATIVE=OFF -DCMAKE_CUDA_ARCHITECTURES=$cudav -DGGML_CUDA_FORCE_MMQ=1 -DGGML_CUDA_PEER_MAX_BATCH_SIZE=$cudaBatchSize -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS

cmake --build build --config Release -j 6