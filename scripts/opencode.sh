#! /bin/bash

curl -fsSL https://opencode.ai/install | bash
mkdir ~/.config/opencode
cd ..

mkdir -p ~/.config/systemd/user
cp services/opencode-web.service ~/.config/systemd/user/opencode-web.service
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web
systemctl --user start opencode-web
systemctl --user status opencode-web

