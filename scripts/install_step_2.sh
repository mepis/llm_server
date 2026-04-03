 #!/bin/bash
CURRENT_DIR=$(pwd)

# Create dirs
mkdir $HOME/.config/opencode 
mkdir -p $HOME/.config/systemd/user 
mkdir $HOME/.llm_server 
mkdir $HOME/.llm_server/logs 
mkdir $HOME/.llm_server/models 

cd $HOME/.llm_server/models
wget -q https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-IQ4_NL.gguf 

# Install OpenCode
cd ..
curl -fsSL https://opencode.ai/install | bash 
cp -r integrations/opencode/* $HOME/.config/opencode/
cp -r integrations/opencode/services/opencode-web.service $HOME/.config/systemd/user/opencode-web.service 

cd $HOME/.config/opencode/tools/
npm install 

############################
# Install llama.cpp
############################
echo 
echo Installing Llama.cpp
cd $HOME/.llm_server/
git clone https://github.com/ggml-org/llama.cpp  
cd llama.cpp

NVCC_PATH= which nvcc 
export CUDACXX=$NVCC_PATH

cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_CUDA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA=on -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_COMPRESSION_MODE=balance 

# Add -j "${nproc}" or -j 4 parameters to make compile faster with risk of running out of memory
cmake --build build --config Release -j 8 --clean-first  

echo -e "
[Unit]
Description=Lamma Server
After=network.target

[Service]
Type=simple


WorkingDirectory=%h
# Edit the script path and name for the local system
ExecStart=$CURRENT_DIR/run.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/llama.service

loginctl enable-linger $USER
systemctl --user enable llama.service
systemctl --user start llama.service
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service


