 #!/bin/bash

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


This script will install the following:
- OpenCode
- Llama.cpp
- Qwen3.5-9B LLM model

The following changes will be made:
- User services for llama.cpp and opencode will be created
- Opencode configs, skills, and tools will be copied


####################
#     WARNING!!!   #
####################

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


############################
# Stage Pre-reqs
############################

# Create dirs
echo
echo
echo Creating folders
mkdir $HOME/.config/opencode 
mkdir $HOME/.config/opencode/tools 
mkdir -p $HOME/.config/systemd/user 
mkdir $HOME/.llm_server 
mkdir $HOME/.llm_server/logs 
mkdir $HOME/.llm_server/models 

echo Downloading LLM model
cd $HOME/.llm_server/models
wget -q https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-IQ4_NL.gguf 


############################
# Install OpenCode
############################
echo
echo Installing OpenCode
cd $CURRENT_DIR
curl -fsSL https://opencode.ai/install | bash 
cp -r opencode/config/opencode.json $HOME/.config/opencode/opencode.json
cp -r opencode/skills $HOME/.config/opencode/ 
cp -r opencode/services/opencode-web.service $HOME/.config/systemd/user/opencode-web.service 
cp -r opencode/tools/* $HOME/.config/opencode/tools/ 

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
cmake --build build --config Release -j 4 --clean-first  

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

loginctl enable-linger $USER
systemctl --user enable llama.service
systemctl --user start llama.service
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service

echo "

#########################################

Install is complete. You may want to reboot just to be safe. 

#########################################


---------------------------------------------------
Documentation Links:
SearxNG: https://docs.searxng.org/admin/index.html
OpenCode: https://opencode.ai/docs
Llama.cpp: https://github.com/ggml-org/llama.cpp 


SearxNG: http://127.0.0.1/searxng
OpenCode: http://127.0.0.1:4096/


Good luck, and thank you for all the fish!
---------------------------------------------------

"

