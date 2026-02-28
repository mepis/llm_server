#! /bin/bash

curl -fsSL https://opencode.ai/install | bash
mkdir ~/.config/opencode
cd ..
cp opencode-configs/llama.cpp.json ~/.config/opencode/opencode.json
