cd /tmp
wget -q https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb 
dpkg -i cuda-keyring_1.1-1_all.deb 

# Install pre-reqs
sudo apt update 
sudo apt upgrade -y 

sudo apt install git build-essential cmake ccache pkg-config libssl-dev libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build nvidia-cuda-toolkit -y 

sudo apt update 
sudo apt upgrade -y 
