#!/bin/bash
cd ..
mkdir -p ~/.config/systemd/user
cp ./../integrations/opencode/services/opencode-web.service ~/.config/systemd/user/opencode-web.service
loginctl enable-linger $USER
systemctl --user daemon-reload
systemctl --user enable opencode-web.service
systemctl --user start opencode-web.service
systemctl --user status opencode-web.service