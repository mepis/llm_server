#!/bin/bash

LLM_SERVER_HOME=/home/jon/llm_server/scripts/
cd "${LLM_SERVER_HOME}"

systemctl --user stop llama.service
git pull
systemctl --user start llama.service


