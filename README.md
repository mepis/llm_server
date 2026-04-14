# Do not proceed before reading!

DO NOT RUN THIS SCRIPT WITHOUT SOME KNOWLEDGE OF MANAGING LINUX.
You are on you're own if something goes FUBAR.

Verify the IPs listed in the opencode.json config file are correct.

- Set the host and llama.cpp provider IP to your device's IP.

**This script takes time to complete and requires user input.**

Before proceeding, ensure the Nvidia 580+ Open drivers are installed. If they need to be installed, or you need to check, press 'q' now to exit.

This script will install the following:

- A lot of prerequisites (See below)
- Nvidia Cuda toolkit 13.2
- SearxNG + pre-reqs
- Nginx (for SearxNG)
- OpenCode
- Llama.cpp
- Qwen3.5-9B LLM model

The following changes will be made:

- A new user for SearxNG will be created
- User services for llama.cpp and opencode will be created
- Opencode configs, skills, and tools will be copied

PREREQUISITES: git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 nvidia-cuda-toolkit

# WARNING!!!

Sudo access is required.

!!! Nginx configs will be modified during this process. If you currently have Nginx installed and in use, please beware of this.

!!! NGinx will be open on your local network. Please secure it after installation.

The SearxNG install process will require user input. You must accept all inputs for SearxNG to install correctly. If SearxNG is not installed correctly, OpenCode will not be able to search the internet, which will impact agent performance.

OpenCode is configued with lenient permissions with this install. Update permissions in the opencode/config/opencode.json file and run the update.sh script to change them.

## Additional Info

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

# Instructions

1. Run install_step_1.sh with sudo (sudo ./install_step_1.sh)
2. Run install_step_2.sh without sudo (./install_step_2.sh)

If errors occur, run the uninstall scripts (uninstall_step_1.sh requires sudo, step_2 does not.) Then re-run the install scripts. These scripts do not have any error handling.

# Documentation Links

SearxNG: https://docs.searxng.org/admin/index.html
OpenCode: https://opencode.ai/docs
Llama.cpp: https://github.com/ggml-org/llama.cpp
