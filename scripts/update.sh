#!/bin/bash

echo "
Updating LLM server

This script will re-run the OpenCode installer to update OpenCode, pull the latest updates for llama.cpp and rebuild it, copy new OpenCode skills and tools to OpenCode's configs, and restart the services. 

This process may take some time. 

"

read -n 1 -s -r -p "Press 'q' to quit, any other key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi

git pull

cp -r opencode/config/opencode.json $HOME/.config/opencode/opencode.json
cp -r opencode/skills/* $HOME/.config/opencode/
cp -r opencode/tools/* $HOME/.config/opencode/tools/

cd $HOME/.config/opencode/tools/
npm install


curl -fsSL https://opencode.ai/install | bash

cd $HOME/.llm_server/llama.cpp

export CUDACXX=${which nvcc}

cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_CUDA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA=on -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_COMPRESSION_MODE=balance

cmake --build build --config Release -j "${nproc}" --clean-first 

systemctl --user stop llama.service
systemctl --user start llama.service

systemctl --user stop opencode-web.service
systemctl --user start opencode-web.service
