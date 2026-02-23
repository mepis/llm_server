#! /bin/bash

cd ..

sudo apt update -y
sudo apt upgrade -y

git submodule update --init --recursive

cd scripts

./build.sh