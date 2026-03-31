#!/bin/bash

if [ "$EUID" -ne 0 ]; then echo "Please run this script as root user"; exit 1; fi


############################
# CONFIGS
############################

CURRENT_DIR=$(pwd)

############################
# USER CONSENT 
############################


echo "

####################
#  PLEASE READ ME! #
####################

DO NOT RUN THIS SCRIPT WITHOUT SOME KNOWLEDGE OF MANAGING LINUX. 
You are on you're own if something goes FUBAR.

-----
This script takes time to complete and requires user input.

-----
Before proceeding, ensure the Nvidia 580+ Open drivers are installed. If they need to be installed, or you need to check, press 'q' now to exit. 

This script will install the following:
- A lot of prerequisites (See below)
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

PREREQUISITES: git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 nvidia-cuda-toolkit

####################
#     WARNING!!!   #
####################
Sudo access is required.

Nginx configs will be modified during this process. If you currently have Nginx installed and in use, please beware of this. 

NGinx will be open on your local network. Please secure it after installation. 

The SearxNG install process will require user input. You must accept all inputs for SearxNG to install correctly. If SearxNG is not installed correctly, OpenCode will not be able to search the internet, which will impact agent performance. 

OpenCode is configued with lenient permissions with this install. Update permissions in the opencode/config/opencode.json file and run the update.sh script to change them.

####################
#    END WARNING   #
####################

## Additional Info ##
---------------------
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
echo
echo
echo Installing prerequisite packages

# Install Nvidia cuda toolkit
cd /tmp
wget -q https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb 
sudo dpkg -i cuda-keyring_1.1-1_all.deb > out.log 2> err.log 

# Install pre-reqs
sudo apt update > out.log 2> err.log 
sudo apt upgrade -y > out.log 2> err.log 

sudo apt install git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 cuda-toolkit-13-2-config-common -y > out.log 2> err.log 

echo
nvidia-smi
echo
echo You should see Nvidia GPU info above. If you do not, restart the computer and then re-run this script. 
echo 
read -n 1 -s -r -p "Do you see Nvidia GPU info? If not, press 'q' to quit. Otherwise, press any key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi

# Create dirs
echo
echo
echo Creating folders
mkdir $HOME/.config/opencode > out.log 2> err.log 
mkdir $HOME/.config/opencode/tools > out.log 2> err.log 
mkdir -p $HOME/.config/systemd/user > out.log 2> err.log 
mkdir $HOME/.llm_server > out.log 2> err.log 
mkdir $HOME/.llm_server/logs > out.log 2> err.log 
mkdir $HOME/.llm_server/models > out.log 2> err.log 

echo Downloading LLM model
cd $HOME/.llm_server/models
wget -q https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-IQ4_NL.gguf 


############################
# Install OpenCode
############################
echo
echo Installing OpenCode
cd $CURRENT_DIR
curl -fsSL https://opencode.ai/install | bash > out.log 2> err.log 
cp -r opencode/skills $HOME/.config/opencode/ > out.log 2> err.log 
cp -r opencode/services/opencode-web.service $HOME/.config/systemd/user/opencode-web.service > out.log 2> err.log 
cp -r opencode/tools/* $HOME/.config/opencode/tools/ > out.log 2> err.log 

cd $HOME/.config/opencode/tools/
npm install > out.log 2> err.log 

############################
# Install Searxng
############################
echo
echo Installing Searxng
cd $CURRENT_DIR
cd searxng
sudo -H ./install.sh

SEARXNG_SECRET_KEY= openssl rand -base64 16 
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
echo 
echo Installing Llama.cpp
cd $HOME/.llm_server/
git clone https://github.com/ggml-org/llama.cpp  > out.log 2> err.log 
cd llama.cpp

NVCC_PATH= which nvcc 
export CUDACXX=$NVCC_PATH

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
echo 
echo Starting services
loginctl enable-linger $USER
systemctl --user daemon-reload

systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service

systemctl --user enable llama.service
systemctl --user start llama.service

echo =========================
systemctl --user status opencode-web.service
echo =========================
systemctl --user status llama.service

echo "

---------------------------------------------------
Documentation Links:
SearxNG: https://docs.searxng.org/admin/index.html
OpenCode: https://opencode.ai/docs
Llama.cpp: https://github.com/ggml-org/llama.cpp 

Install is complete. You may want to reboot just to be safe. 

SearxNG: http://127.0.0.1/searxng
OpenCode: http://127.0.0.1:4096/


Good luck, and thank you for all the fish!
---------------------------------------------------

"

