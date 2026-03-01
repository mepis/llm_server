#! /bin/bash

cd ..
mkdir models
git clone https://github.com/ggml-org/llama.cpp
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export GGML_CCACHE=ON

sudo apt build-essential ccmake ccache nvidia-cuda-toolkit libopenblas-dev

echo 
echo
echo "######################################################################"
echo "# NVidia Info"
echo "# You should see the results of nvidia-smi"
echo "# Verify CUDA version (top right) to ensure Cuda toolkit is installed"
echo "######################################################################"
nvidia-smi