 #!/bin/bash

if [ "$EUID" -ne 0 ]; then echo "Please run this script as root user"; exit 1; fi

############################
# CONFIGS
############################

CURRENT_DIR=$(pwd)

echo "
#####################
#  PLEASE READ ME!  #
#####################

Before proceeding, ensure the Nvidia 580+ Open drivers are installed. If they need to be installed, or you need to check, press 'q' now to exit. 

This script will install the following:
- A lot of prerequisites (See below)
- Nvidia Cuda toolkit 13.2
- SearxNG + pre-reqs
- Nginx (for SearxNG)

The following changes will be made:
- A new user for SearxNG will be created

PREREQUISITES: git build-essential cmake ccache libopenblas-dev pkg-config libssl-dev libopenblas64-dev nvtop libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 nvidia-cuda-toolkit

####################
#    WARNING!!!    #
####################
Sudo access is required.

!!! Nginx configs will be modified during this process. If you currently have Nginx installed and in use, please beware of this. 

!!! NGinx will be open on your local network. Please secure it after installation. 

The SearxNG install process will require user input. You must accept all inputs for SearxNG to install correctly. If SearxNG is not installed correctly, OpenCode will not be able to search the internet, which will impact agent performance. 


####################
#    END WARNING   #
####################
"

############################
# Stage Pre-reqs
############################
echo
echo Installing prerequisite packages

# Install Nvidia cuda toolkit
cd /tmp
wget -q https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb 
dpkg -i cuda-keyring_1.1-1_all.deb > /dev/null 2> /dev/null

# Install pre-reqs
apt update > /dev/null 2> /dev/null
apt upgrade -y > /dev/null 2> /dev/null

apt install git build-essential cmake ccache pkg-config libssl-dev libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 cuda-toolkit-13-2-config-common -y > /dev/null 2> /dev/null

############################
# Install Searxng
############################
echo
echo Installing Searxng
cd $CURRENT_DIR
sudo git clone "https://github.com/searxng/searxng" "/usr/local/searxng/searxng-src"
cd /usr/local/searxng/searxng-src
git config --global --add safe.directory /usr/local/searxng
sudo -H ./utils/searxng.sh install all

SEARXNG_SECRET_KEY=$(openssl rand -base64 16)
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

systemctl restart uwsgi.service
systemctl restart nginx.service