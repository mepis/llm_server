#!/bin/bash
cd ..
mkdir -p ~/.config/systemd/user
cp ./../integrations/linux/llama.service ~/.config/systemd/user/llama.service
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable llama.service
systemctl --user start llama.service
systemctl --user status llama.service