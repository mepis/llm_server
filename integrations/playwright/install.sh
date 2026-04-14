#!/bin/bash
CURRENT_DIR=$(pwd)


systemctl --user stop playwright.service
systemctl --user disable playwright.service
rm $HOME/.config/systemd/user/playwright.service

cd app
npm install
npx playwright install
npx playwright install-deps

echo -e "
[Unit]
Description=Playwright Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$CURRENT_DIR/app
ExecStart=$CURRENT_DIR/app/./start.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
" >> $HOME/.config/systemd/user/playwright.service


loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable playwright.service
systemctl --user start playwright.service