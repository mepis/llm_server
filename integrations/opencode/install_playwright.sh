#!/bin/bash
sudo npm install -g @playwright/cli@latest
sudo npx playwright install-deps
sudo npx playwright install

sudo mkdir -p /opt/google/chrome
sudo ln -sf /home/jon/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome /opt/google/chrome/chrome
