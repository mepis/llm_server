#!/bin/bash

############################
# CONFIGS
############################

CURRENT_DIR=$(pwd)

############################
# USER CONSENT 
############################

echo "

PLEASE READ ME!

DO NOT RUN THIS SCRIPT WITHOUT SOME KNOWLEDGE OF MANAGING LINUX. You are on you're own if something goes FUBAR.

Before proceeding, ensure the Nvidia 580+ Open drivers are installed. If they need to be installed, or you need to check, press 'q' now to exit. 

This script will install the following:
- A lot of prerequisites
- Nvidia Cuda toolkit 13.2
- OpenCode
- SearxNG + pre-reqs
- Nginx (for SearxNG)
- Llama.cpp
- Qwen3.5-9B LLM model

The following changes will be made:
- A new user for SearxNG will be created
- User services for llama.cpp and opencode will be created
- Opencode configs, skills, and tools will be copied

Documentation Links:
SearxNG: https://docs.searxng.org/admin/index.html
OpenCode: https://opencode.ai/docs
Llama.cpp: https://github.com/ggml-org/llama.cpp 

PREREQUISITES: git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common libze-intel-gpu1 libze1 intel-metrics-discovery intel-opencl-icd clinfo intel-gsc intel-media-va-driver-non-free libmfx-gen1 libvpl2 libvpl-tools libva-glx2 va-driver-all vainfo libze-dev intel-ocloc libze-intel-gpu-raytracing intel-deep-learning-essentials intel-oneapi-base-toolkit ninja-build cuda-toolkit-13-2 python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc

The SearxNG install process will require user input. You must accept all inputs for SearxNG to install correctly. If SearxNG is not installed correctly, OpenCode will not be able to search the internet, which will impact agent performance. 

This process will take a while to complete. 

## Additional Info ##
Use the update.sh script to update OpenCode and Llama.cpp in the future. 
Use the uninstall.sh script to remove everything except for Cuda Toolkit and the prereq packages.

Additional models can be downloaded from hugging face. 
1. CD to ~/.llm_server/models 
2. Use wget to download the model (wget http://link.to.model)
3. Copy one of the run scripts in the models_profiles folder and update the model file in the new script.
4. Add the new script to the run.sh file and comment out the old run_xx.sh script.
5. Run update.sh

If you choose to attempt to change the models, you are own your own. Extensive tests have been run to find the best configs for llama.cpp, model downloaded in this script, and the configs for for OpenCode.

Llama.cpp is configured to enable Nvidia Unified Memory. VRAM usage will spill to system memory. If system memory is heavily utilized, Llama.cpp may crash. If swap is enabled, Llama.cpp performance may suffer. The configs have been optimized for the laptops issued from IPQS. Potential issues should be mitigated. If you change the configs, you are own your own. 
"

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

sudo apt install git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common libze-intel-gpu1 libze1 intel-metrics-discovery intel-opencl-icd clinfo intel-gsc intel-media-va-driver-non-free libmfx-gen1 libvpl2 libvpl-tools libva-glx2 va-driver-all vainfo libze-dev intel-ocloc libze-intel-gpu-raytracing intel-deep-learning-essentials intel-oneapi-base-toolkit ninja-build cuda-toolkit-13-2 python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc

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

cd $HOME/.llm_server/models
wget https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-IQ4_NL.gguf


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

############################
# Install Searxng
############################

cd $CURRENT_DIR
cd searxng
sudo ./install.sh

SEARXNG_SECRET_KEY=${openssl rand -base64 16}
sudo rm /etc/searxng/settings.yml 
sudo echo -e "
# SearXNG settings

use_default_settings: true

general:
  debug: false
  instance_name: "SearXNG"

search:
  safe_search: 2
  autocomplete: "duckduckgo"
  formats:
    - html
    - json
    - csv
    - rss

server:
  secret_key: $SEARXNG_SECRET_KEY
  limiter: true
  image_proxy: true

valkey:
  url: valkey://localhost:6379/0
" >> /etc/searxng/settings.yml 

############################
# Install llama.cpp
############################

cd $HOME/.llm_server/
git clone https://github.com/ggml-org/llama.cpp 
cd llama.cpp

export CUDACXX=${which nvcc}

cmake -B build -DGGML_CCACHE=on -DGGML_LTO=on -DGGML_CUDA=on -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 -DGGML_CUDA_GRAPHS=on -DGGML_CUDA_FORCE_MMQ=on -DGGML_CUDA_FA=on -DGGML_CUDA_FA_ALL_QUANTS=on -DGGML_CUDA_COMPRESSION_MODE=balance

cmake --build build --config Release -j "${nproc}" --clean-first 

echo -e "
[Unit]
Description=Lamma Server
After=network.target

[Service]
Type=simple
WorkingDirectory=%h
# Edit the script path and name for the local system
ExecStart=$HOME/llm_server/scripts/run.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/llama.service

############################
# Start services
############################

loginctl enable-linger $USER
systemctl --user daemon-reload

systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service

systemctl --user enable llama.service
systemctl --user start llama.service

scho =========================
systemctl --user status opencode-web.service
scho =========================
systemctl --user status llama.service


