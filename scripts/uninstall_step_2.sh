#!/bin/bash

# remove opencode
systemctl --user stop opencode-web.service
systemctl --user disable opencode-web.service
rm -r $HOME/.config/systemd/user/opencode-web.service
rm -r $HOME/.opencode
rm -r $HOME/.config/opencode

# remove llama.cpp
systemctl --user stop llama.service
systemctl --user disable llama.service
rm -r $HOME/.config/systemd/user/llama.service
rm -r $HOME/.llm_server

