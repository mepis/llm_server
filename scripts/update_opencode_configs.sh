#! /bin/bash

cd ..
rm ~/.config/opencode/opencode.json
cp ~/git/llm_server/opencode-configs/llama.cpp.json ~/.config/opencode/opencode.json
systemctl --user daemon-reload
systemctl --user restart opencode-web
systemctl --user status opencode-web
