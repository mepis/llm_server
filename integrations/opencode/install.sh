#!/bin/bash

curl -fsSL https://opencode.ai/install | bash

# Stage configs
rm -r $HOME/.config/opencode/
mkdir $HOME/.config/opencode
mkdir $HOME/.config/opencode/tools
mkdir -p $HOME/.config/systemd/user

cp skills $HOME/.config/opencode/
cp tools/* $HOME/.config/opencode/tools/

cd $HOME/.config/opencode/tools/
npm install

echo -e "
[Unit]
Description=OpenCode Web Server
After=network.target

[Service]
Type=simple
WorkingDirectory=%h
ExecStart=$HOME/.opencode/bin/opencode web
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/opencode-web.service

loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web.service
systemctl --user restart opencode-web.service


