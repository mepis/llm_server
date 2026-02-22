#! /bin/bash
sudo apt update -y
sudo apt upgrade -y
sudo apt install build-essential
git submodule update --init --recursive