#!/bin/bash 

# CONFIGS
repeat=1
batch=512-5120+512
ubatch=512-5120+512
flash=0
mmapOn=1
dioOn=1
cachType=q4_0

ls -l ~/llm_server/models *.gguf

echo 
echo ======================================
echo "Enter model:"
read model

~/llm_server/llama.cpp/build/bin/./llama-bench -m ~/llm_server/models/$model --split-mode layer --tensor-split 16,12,12 --main-gpu 0  --batch-size $batch -ub $ubatch -ctk $cachType --flash-attn $flash --poll 75 --mmap $mmapOn --direct-io $dioOn --progress -r $repeat