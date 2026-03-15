mkdir -p "${MODELS_DIR}"
mkdir -p "${LLAMA_ROOT}/llama_logs"

sudo apt install build-essential cmake ccache nvidia-cuda-toolkit libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop
nvidia-smi

