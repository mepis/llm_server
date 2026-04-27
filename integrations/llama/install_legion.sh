#!/bin/bash

# User Defined
MODEL=router_legion.sh
# -----------------------

export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export PATH=/usr/local/cuda-13.2/bin${PATH:+:${PATH}}
CURRENT_DIR=$(pwd)

mkdir $HOME/.llama_cache
mkdir $HOME/.config/systemd
mkdir $HOME/.config/systemd/user
mkdir ~/.llm_models

systemctl --user stop llama.service
systemctl --user disable llama.service
rm $HOME/.config/systemd/user/llama.service

read -p "Do you want to compile llama.cpp? (y/n): " choice
if [ "$choice" == "y" ]; then
    
  git clone https://github.com/ggml-org/llama.cpp 

  cd llama.cpp
  rm -r build
  git pull

  cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_NATIVE=off -DCMAKE_CUDA_ARCHITECTURES="86;120"  -DGGML_CUDA=on -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=256 -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA_ALL_QUANTS=on 

  cmake --build build --config Release -j 14 --clean-first  

fi

echo -e "
[Unit]
Description=Lamma Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$CURRENT_DIR
ExecStart=$CURRENT_DIR/$MODEL
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/llama.service

loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable llama.service
systemctl --user start llama.service
