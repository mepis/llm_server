#!/bin/bash

##################
# Edit the service file before installing!
##################

echo ##################
echo # Edit the service file before installing! It must be configured for the local system
echo ##################

read -n 1 -s -r -p "Press 'q' to quit, any other key to continue..."
if [[ $REPLY == "q" ]]; then
    exit 0
fi

cd ..
mkdir -p ~/.config/systemd/user
cp services/llama.service ~/.config/systemd/user/llama.service
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable llama.service
systemctl --user start llama.service
systemctl --user status llama.service