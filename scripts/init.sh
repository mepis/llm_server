#!/bin/bash

# intel docs: https://dgpu-docs.intel.com/driver/client/overview.html 
# intel apt docs: https://www.intel.com/content/www/us/en/docs/oneapi/installation-guide-linux/2025-2/base-apt.html#BASE-APT 
# nvidia cuda toolkit install: https://developer.nvidia.com/cuda-downloads

LLM_SERVER_HOME=~/.llm_server

mkdir "${LLM_SERVER_HOME}"
mkdir "${LLM_SERVER_HOME}"/logs
mkdir "${LLM_SERVER_HOME}"/models

sudo apt update
sudo apt upgrade -y


# Base package install
sudo apt install build-essential cmake ccache nvidia-cuda-toolkit libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common 

# Intel install
sudo add-apt-repository -y ppa:kobuk-team/intel-graphics

wget -O- https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB | gpg --dearmor | sudo tee /usr/share/keyrings/oneapi-archive-keyring.gpg > /dev/null

echo "deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.gpg] https://apt.repos.intel.com/oneapi all main" | sudo tee /etc/apt/sources.list.d/oneAPI.list

sudo apt update
sudo apt-get install -y libze-intel-gpu1 libze1 intel-metrics-discovery intel-opencl-icd clinfo intel-gsc intel-media-va-driver-non-free libmfx-gen1 libvpl2 libvpl-tools libva-glx2 va-driver-all vainfo libze-dev intel-ocloc libze-intel-gpu-raytracing intel-deep-learning-essentials intel-oneapi-base-toolkit ninja-build

# Nvidia Install
cd /tmp
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin
sudo mv cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/13.2.0/local_installers/cuda-repo-ubuntu2404-13-2-local_13.2.0-595.45.04-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2404-13-2-local_13.2.0-595.45.04-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2404-13-2-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt-get update
sudo apt-get -y install cuda-toolkit-13-2

nvidia-smi
clinfo | grep "Device Name"
