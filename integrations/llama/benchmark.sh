#!/bin/bash
# MODEL=Qwen3.6-35B-A3B-MXFP4_MOE.gguf
# MODEL=Qwen3.6-27B-Q8_0.gguf
# MODEL=Nemotron-3-Nano-30B-A3B-Q8_0.gguf
# MODEL=Qwen3.6-35B-A3B-Q8_0.gguf
# MODEL=Qwen3.6-35B-A3B-MXFP4_MOE.gguf
MODEL=gemma-4-E4B-it-IQ4_NL.gguf 

# Benchmark configs
batch_size=256,512,1024
ubatch_size=128,256,512

threads=28


# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer

# Model Configs
context=131072

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

export CUDA_SCALE_LAUNCH_QUEUES=16x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)

## added for benchmarks
export LLAMA_ARG_MLOCK=on
# export LLAMA_ARG_SWA_FULL=on
export LLAMA_ARG_MMAP=off
export LLAMA_ARG_FIT=on
export LLAMA_ARG_FIT_TARGET=256
export LLAMA_ARG_FIT_CTX=131072
export LLAMA_ARG_FLASH_ATTN=1
export LLAMA_ARG_CONT_BATCHING=on
# export LLAMA_ARG_N_PREDICT=0
# export LLAMA_ARG_N_PARALLEL=6

# ./llama-bench -m $MODEL_DIR/$MODEL -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --batch-size $batch_size --ubatch-size $ubatch_size --threads $threads --fit-target 512 --fit-ctx 131072 

./llama-bench -m $MODEL_DIR/$MODEL -ngl 999 --main-gpu $mainGpu --fit-target 512 --fit-ctx 131072 --batch-size $batch_size --ubatch-size $ubatch_size -fa 1 --cpu-strict 1 --threads 8 


# --verbose --mlock 1  --fit on --fit-target 512 --fit-ctx 262144 --swa-full --cont-batching --parallel 6 --sequences 2 --threads $threads --cpu-range 0-7 --cpu-strict-batch 1 --threads-batch 8 --jinja