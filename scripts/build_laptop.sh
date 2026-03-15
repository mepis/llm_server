#!/ /bin/bash
source "$(dirname "$0")/central_config.sh"

export GGML_CCACHE=ON

git clone https://github.com/ggml-org/llama.cpp "${LLAMA_ROOT}/llama.cpp"
cd "${LLAMA_ROOT}/llama.cpp"
rm -r build
cmake -B build -DBUILD_SHARED_LIBS=OFF -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=$cudav -DGGML_CUDA_FORCE_MMQ=1 -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS
cmake --build build --config Release -j 8