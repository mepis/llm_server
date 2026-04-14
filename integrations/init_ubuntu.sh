#!/bin/bash

# Install pre-reqs
sudo apt update 
sudo apt upgrade -y 

sudo apt install git build-essential cmake ccache pkg-config libssl-dev libnccl-dev libcurl4-openssl-dev curl libgomp1 software-properties-common clinfo ninja-build nvidia-cuda-toolkit -y 

