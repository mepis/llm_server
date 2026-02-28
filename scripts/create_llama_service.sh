#! /bin/bash
cd ..

mkdir -p ~/.config/systemd/user
cp services/llama.service ~/.config/systemd/user/llama.service
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web
systemctl --user start opencode-web
systemctl --user status opencode-web

