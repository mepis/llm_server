#! /bin/bash

echo "######################################################################"
echo "# This script compiles llama.cpp with support for Nvidia 50xx cards"
echo "# Cuda toolkit v13 **MUST** be installed"
echo "# If you are not using a Geforce 50xx card or not user Cuda Toolkit"
echo "#   13, run the other 'build_fallback.sh' script"
echo "######################################################################"

cd ..
cd llama.cpp  

git pull
rm -r build
cmake -B build
/ -DBUILD_SHARED_LIBS=OFF
/ -DGGML_CUDA=ON
/ -DGGML_NATIVE=OFF
/ -DCMAKE_CUDA_ARCHITECTURES="86;89;120"
/ -DGGML_CUDA_FORCE_MMQ=1
/ -DGGML_CUDA_PEER_MAX_BATCH_SIZE=128

cmake --build build --config Release -j 6