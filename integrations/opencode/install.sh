#!/bin/bash

##################
# Edit the service file before installing!
##################

echo ##################
echo Edit the service file before installing! It must be configured for the local system
echo ##################

read -n 1 -s -r -p "Press 'q' to quit, any other key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi



# Install
curl -fsSL https://opencode.ai/install | bash

# Stage configs
mkdir ~/.config/opencode
mkdir ~/.config/opencode/tools
mkdir -p ~/.config/systemd/user

cp skills ~/.config/opencode/

# Configure service
cp services/opencode-web.service ~/.config/systemd/user/opencode-web.service
cp tools/* ~/.config/opencode/tools/

cd ~/.config/opencode/tools/
npm install

loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service
systemctl --user status opencode-web.service