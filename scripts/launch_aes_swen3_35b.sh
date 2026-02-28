#! /bin/bash

export LLAMA_CACHE=/home/jon/llm_server/models

cd ~/home/jon/llm_server/llama.cpp/build/bin
./llama-server -hf AesSedai/Qwen3.5-35B-A3B-GGUF:Q4_K_M  \
  --port 3000 \
  --host 100.115.205.84 \
  --no-mmap \
   -c 64000 \
  -ngl 99 \
  --split-mode layer \
  --tensor-split 16/12/12  \
  --main-gpu 0 \
  --spec-type ngram-mod --spec-ngram-size-n 24 --draft-min 48 --draft-max 64 \
  -n 2048 -b 1024 -ub 512 -ctk q4_0 --flash-attn on --reasoning-budget -1 
#  & disown

