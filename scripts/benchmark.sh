#!/bin/bash 

# CONFIGS
repeat=1

ls -l ~/llm_server/models *.gguf

echo 
echo ======================================
echo "Enter model:"
read model

# ~/llm_server/llama.cpp/build/bin/./llama-bench -m ~/llm_server/models/$model --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -n 1024-5120+1024 --batch-size 4096 -ub 512 -ctk q4_0 --flash-attn 0 --poll 75 --mmap 1   --direct-io 1 --progress -r $repeat

~/llm_server/llama.cpp/build/bin/./llama-bench -m ~/llm_server/models/$model --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -n 1024-5120+1024 --batch-size 4096 -ub 512 -ctk q4_0 --flash-attn 0 --poll 75 --mmap 1   --direct-io 1 --progress -r $repeat