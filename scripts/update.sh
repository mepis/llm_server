#!/bin/bash

systemctl --user stop llama.service
git pull
./buid.sh
systemctl --user start llama.service


