#!/bin/bash
CURRENT_DIR=$(pwd)

# MODEL=Qwen3.5-27B-IQ4_NL.sh
# MODEL=gemma-4-26B-A4B-it-MXFP4_MOE.sh
# MODEL=Qwen3.5-35B-A3B-MXFP4_MOE.sh
# MODEL=Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q4_K_M.sh
# MODEL=Nemotron-3-Nano-30B-A3B-IQ4_NL.sh
# MODEL=Qwen3.5-122B-A10B-UD-IQ2_XXS.sh
MODEL=Qwen3.6-35B-A3B-MXFP4_MOE.sh

###############################################################

mkdir $HOME/.config/systemd
mkdir $HOME/.config/systemd/user
mkdir ~/.llm_models

systemctl --user stop llama.service
systemctl --user disable llama.service
rm $HOME/.config/systemd/user/llama.service
rm run.sh

echo -e "#!/bin/bash


CURRENT_DIR=$(pwd)
cd $CURRENT_DIR

$CURRENT_DIR/models/./$MODEL

" >> $CURRENT_DIR/run.sh
chmod 755 run.sh


git clone https://github.com/ggml-org/llama.cpp 

cd llama.cpp
rm -r build
git pull

export CUDACXX=$(which nvcc)

cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_NATIVE=off -DCMAKE_CUDA_ARCHITECTURES="86;120"  -DGGML_CUDA=on -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA_ALL_QUANTS=on 

# -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CPU=off -DGGML_CUDA_COMPRESSION_MODE=off -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_FORCE_CUBLAS=on -DGGML_CCACHE=on  

# Add -j "${nproc}" or -j 4 parameters to make compile faster with risk of running out of memory
cmake --build build --config Release -j 8 --clean-first  

echo -e "
[Unit]
Description=Lamma Server
After=network.target

[Service]
Type=simple
WorkingDirectory=%h
ExecStart=$CURRENT_DIR/run.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/llama.service


loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable llama.service
systemctl --user start llama.service
