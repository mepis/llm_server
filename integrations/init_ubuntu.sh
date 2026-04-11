cd /tmp
wget -q https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb 
dpkg -i cuda-keyring_1.1-1_all.deb 

# Install pre-reqs
apt update 
apt upgrade -y 

apt install git build-essential cmake ccache pkg-config libssl-dev libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build python3-dev python3-babel python3-venv python-is-python3 uwsgi uwsgi-plugin-python3 libxslt-dev zlib1g-dev libffi-dev nginx nginx-common fcgiwrap nginx-doc nvidia-cuda-toolkit cuda-toolkit-13-2 cuda-toolkit-13-2-config-common -y 
