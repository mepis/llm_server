#!/bin/bash

CURRENT_DIR=$(pwd)

git pull

# Install llama.cpp
cd $HOME/.llm_server/llama.cpp
git pull

NVCC_PATH=$(which nvcc) 
export CUDACXX=$NVCC_PATH

cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_CUDA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA=on -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_COMPRESSION_MODE=balance 

# Add -j "${nproc}" or -j 4 parameters to make compile faster with risk of running out of memory
cmake --build build --config Release -j 10 --clean-first  

systemctl --user stop llama.service
systemctl --user start llama.service