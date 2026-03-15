#! /bin/bash

cudav="89"

cd ~/git/llm_server/
rm -r llama.cpp
git clone https://github.com/ggml-org/llama.cpp

export GGML_CCACHE=ON

cd ..
cd ~/git/llm_server/llama.cpp  
rm -r build
cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=$cudav -DGGML_CUDA_FORCE_MMQ=1 -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS

cmake --build build --config Release -j 8