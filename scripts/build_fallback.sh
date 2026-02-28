#! /bin/bash

echo "######################################################################"
echo  This script compiles llama.cpp with support for Nvidia 40xx cards or below. 
echo "######################################################################"

cd ..
cd llama.cpp  

git pull
rm -r build
cmake -B build
/ -DBUILD_SHARED_LIBS=OFF
/ -DGGML_CUDA=ON
/ -DGGML_NATIVE=OFF
/ -DCMAKE_CUDA_ARCHITECTURES="86;89"
/ -DGGML_CUDA_FORCE_MMQ=1
/ -DGGML_CUDA_PEER_MAX_BATCH_SIZE=128

cmake --build build --config Release -j 6