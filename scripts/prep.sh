#! /bin/bash

cd ..
mkdir models
git clone https://github.com/ggml-org/llama.cpp
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export GGML_CCACHE=OFF