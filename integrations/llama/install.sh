cd $HOME

git clone https://github.com/ggml-org/llama.cpp 

cd llama.cpp
rm -r build
git pull

NVCC_PATH= which nvcc 
export CUDACXX=$NVCC_PATH

cmake -B build -DGGML_LTO=on -DGGML_CUDA=on -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_COMPRESSION_MODE=none -DGGML_CUDA_FORCE_CUBLAS=on 

# -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CPU=off -DGGML_CUDA_COMPRESSION_MODE=off -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_FORCE_CUBLAS=on -DGGML_CCACHE=on 

# Add -j "${nproc}" or -j 4 parameters to make compile faster with risk of running out of memory
cmake --build build --config Release -j 8 --clean-first  

systemctl --user stop llama.service
systemctl --user start llama.service
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
