#!/bin/bash

############################
# CONFIGS
############################

LLM_SERVER_HOME=$HOME/.llm_server
CURRENT_DIR=$(pwd)

############################
# USER CONSENT 
############################

echo  
echo Edit the service file before installing! It must be configured for the local system
echo  

read -n 1 -s -r -p "Press 'q' to quit, any other key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi

############################
# Stage Pre-reqs
############################

# Install Nvidia cuda toolkit
cd /tmp
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-ubuntu2404.pin
sudo mv cuda-ubuntu2404.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/13.2.0/local_installers/cuda-repo-ubuntu2404-13-2-local_13.2.0-595.45.04-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2404-13-2-local_13.2.0-595.45.04-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2404-13-2-local/cuda-*-keyring.gpg /usr/share/keyrings/

# Install pre-reqs
sudo apt update
sudo apt upgrade -y

sudo apt install git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common libze-intel-gpu1 libze1 intel-metrics-discovery intel-opencl-icd clinfo intel-gsc intel-media-va-driver-non-free libmfx-gen1 libvpl2 libvpl-tools libva-glx2 va-driver-all vainfo libze-dev intel-ocloc libze-intel-gpu-raytracing intel-deep-learning-essentials intel-oneapi-base-toolkit ninja-build cuda-toolkit-13-2 python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx

echo ######################################
nvidia-smi
echo
echo You should see Nvidia GPU info above. If you do not, restart the computer and then re-run this script. 
echo 
read -n 1 -s -r -p "Do you see Nvidia GPU info? If not, press 'q' to quit. Otherwise, press any key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi

# Create dirs
mkdir $HOME/.config/opencode
mkdir $HOME/.config/opencode/tools
mkdir -p $HOME/.config/systemd/user
mkdir $HOME/.llm_server
mkdir $HOME/.llm_server/logs
mkdir $HOME/.llm_server/models



############################
# Install OpenCode
############################

cd $CURRENT_DIR
curl -fsSL https://opencode.ai/install | bash
cp opencode/skills $HOME/.config/opencode/
cp opencode/services/opencode-web.service $HOME/.config/systemd/user/opencode-web.service
cp opencode/tools/* $HOME/.config/opencode/tools/

cd $HOME/.config/opencode/tools/
npm install

# https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-IQ4_NL.gguf

loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service
systemctl --user status opencode-web.service


