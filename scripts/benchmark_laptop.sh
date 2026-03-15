#!/bin/bash 

# CONFIGS
repeat=1
batch=512-2048+512
ubatch=128-512+128
flash=0
mmapOn=1
polling=10
dioOn=1
cachType=bf16
nprompt=512
ngen=128
threads=28

ls -l "${MODELS_DIR}"/*.gguf

echo 
echo ======================================
echo "Enter model:"
read model


cd "${LLAMA_BUILD_DIR}/bin"
CUDA_SCALE_LAUNCH_QUEUES=4x GGML_CUDA_FORCE_MMQ=true GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 "${LLAMA_BENCH_BIN}" -m "${MODELS_DIR}/$model" --batch-size $batch -ub $ubatch -ctk $cachType --flash-attn $flash --poll $polling --mmap $mmapOn --direct-io $dioOn -r $repeat --n-prompt $nprompt --n-gen $ngen --threads $threads --flash-attn 0