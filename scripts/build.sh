#! /bin/bash

cudav="86;89"
cudaBatchSize=64

cd ..
mkdir models

sudo apt build-essential ccmake ccache nvidia-cuda-toolkit libopenblas-dev
nvidia-smi

sudo rm -r llama.cpp
git clone https://github.com/ggml-org/llama.cpp
# export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
# export GGML_CCACHE=OFF

nvidia-smi

cd llama.cpp  
GGML_CCACHE=on cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DGGML_NATIVE=OFF -DCMAKE_CUDA_ARCHITECTURES=$cudav -DGGML_CUDA_FORCE_MMQ=1 -DGGML_CUDA_PEER_MAX_BATCH_SIZE=$cudaBatchSize

GGML_CCACHE=on  cmake --build build --config Release -j 6