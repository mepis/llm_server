#!/bin/bash
git pull

CURRENT_DIR=$(pwd)

echo $HOME
cd ..
rm -r $HOME/.config/opencode/

cp -r integrations/opencode/ $HOME/.config
cd $HOME
cd .config/opencode/tools/

npm install

# Install opencode
curl -fsSL https://opencode.ai/install | bash

systemctl --user restart opencode-web.service 