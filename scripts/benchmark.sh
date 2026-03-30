#!/bin/bash 
# Load central configuration

LLM_SERVER_HOME=~/.llm_server

repeat=1
batch=1024
ubatch=512
flash=0
mmapOn=1
polling=80
dioOn=1
cachType=q4_0
outputType=csv
ncmoe=0
nprompt=512
ngen=128


ls -l "${LLM_SERVER_HOME}"/models/*.gguf

echo ======================================
echo Remember to update the configs before running. 
echo If you have not, kill this script and update them now. 
echo ======================================

echo 
echo 
echo "Enter model:"
read model

GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 "${LLAMA_BENCH_BIN}" -m "${MODELS_DIR}/${model}" --split-mode layer --tensor-split 16,12,12 --main-gpu 0 --batch-size $batch -ub $ubatch -ctk $cachType --flash-attn $flash --poll $polling --mmap $mmapOn --direct-io $dioOn -r $repeat --n-prompt $nprompt --n-gen $ngen # -ncmoe $ncmoe   --progress --output $outputType