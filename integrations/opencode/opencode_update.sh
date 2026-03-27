#!/bin/bash
curl -fsSL https://opencode.ai/install | bash

rm -r ~/.config/opencode/*

mkdir ~/.config/opencode/tools
mkdir ~/.config/opencode/skills

cp config/opencode.json ~/.config/opencode/opencode.json
cp -r skills/* ~/.config/opencode/skills
cp tools/* ~/.config/opencode/tools/

systemctl --user restart opencode-web.service 