#!/bin/bash

# Install
curl -fsSL https://opencode.ai/install | bash

# Stage configs
mkdir ~/.config/opencode
mkdir ~/.config/opencode/tools
mkdir -p ~/.config/systemd/user

# Configure service
cp services/opencode-web.service ~/.config/systemd/user/opencode-web.service
cp tools/searxng/* ~/.config/opencode/tools/
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service
systemctl --user status opencode-web.service