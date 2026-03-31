#!/bin/bash

sudo git clone "https://github.com/searxng/searxng" "/usr/local/searxng/"
cd /usr/local/searxng/
git config --global --add safe.directory /usr/local/searxng
sudo -H ./utils/searxng.sh install all
