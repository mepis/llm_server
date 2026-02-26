#! /bin/bash


cd ..
mkdir models
git clone https://github.com/ggml-org/llama.cpp
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export GGML_CCACHE=OFF

cd ~/ 
mkdir downloads
cd downloads

sudo apt install build-essential  ccache  cmake libssl-dev 

wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin
sudo mv cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/13.1.1/local_installers/cuda-repo-ubuntu2404-13-1-local_13.1.1-590.48.01-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2404-13-1-local_13.1.1-590.48.01-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2404-13-1-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt-get update
sudo apt-get -y install cuda-toolkit-13-1

sudo apt-get install -y nvidia-open