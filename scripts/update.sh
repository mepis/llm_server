#!/bin/bash

LLM_SERVER_HOME=/home/jon/llm_server/scripts/
cd "${LLM_SERVER_HOME}"

ls


systemctl --user stop llama.service
git pull

./buid.sh
systemctl --user start llama.service


