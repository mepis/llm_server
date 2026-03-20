#!/bin/bash

rm ~/.config/opencode/opencode.json
cp ./../integrations/opencode/config/opencode.json ~/.config/opencode/opencode.json
systemctl --user restart opencode-web.service 