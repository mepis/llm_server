#! /bin/bash

export LLAMA_CACHE=/home/jon/llama_server/models

cd ..
cd llama.cpp
cd build
cd bin

./llama-server -hf unsloth/Qwen3.5-35B-A3B-GGUF:UD-Q4_K_XL  \
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




