#!/bin/bash 

# CONFIGS
repeat=1
batch=512-5120+512
ubatch=512-5120+512
flash=0
mmapOn=1
polling=10-100+10
dioOn=1
cachType=q4_0
outputType=csv
ncmoe=0-30+1
predict=-1

ls -l ~/llm_server/models *.gguf

echo 
echo ======================================
echo "Enter model:"
read model

GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 ~/llm_server/llama.cpp/build/bin/./llama-bench -m ~/llm_server/models/$model --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --batch-size $batch -ub $ubatch -ctk $cachType --flash-attn $flash --poll $polling --mmap $mmapOn --direct-io $dioOn -r $repeat -ncmoe $ncmoe -p $predict #   --progress --output $outputType