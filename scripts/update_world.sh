#! /bin/bash
sudo apt update -y
sudo apt upgrade -y

cd ..
cd llama.cpp
git pull

cd ..
cd scripts

./build.sh 