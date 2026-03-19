LLM_SERVER_HOME=~/.llm_server

mkdir "${LLM_SERVER_HOME}"
mkdir "${LLM_SERVER_HOME}"/logs

sudo apt install build-essential cmake ccache nvidia-cuda-toolkit libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop
nvidia-smi

