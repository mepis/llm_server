# Host Configs
port=11434
host=100.110.89.87

# Hardware Configs
mainGpu=0
tensorSplit=16,12,12
splitMode=layer
threads=8

# Model Configs
context=131072
temp=0.6
topP=0.95
minP=0.00
topK=20

# valid values: q8_0, q4_0, q4_1, q5_0, q5_1, iq4_nl
K_CACHE_TYPE=q8_0
V_CACHE_TYPE=q8_0

####################
MODEL_DIR=$HOME/.llm_models
CURRENT_DIR=$(pwd)
cd $CURRENT_DIR
cd llama.cpp/build/bin/

export LLAMA_ARG_MLOCK=on
export CUDA_SCALE_LAUNCH_QUEUES=16x 
export LLAMA_CACHE=$modelDir
export GGML_CUDA_ENABLE_UNIFIED_MEMORY=1 
export CUDACXX=$(which nvcc)
export LLAMA_ARG_FIT=on
export LLAMA_ARG_FIT_TARGET=512
export LLAMA_ARG_FIT_CTX=131072

./llama-server --models-dir $MODEL_DIR --models-autoload --models-max 2 --sleep-idle-seconds 30 --port $port --host $host -c $context -ngl 999 --split-mode $splitMode --tensor-split $tensorSplit --main-gpu $mainGpu --temp $temp --top-p $topP --cont-batching --min-p $minP --top-k $topK --kv-unified --cache-type-k q8_0 --cache-type-v q8_0 --parallel 4  --batch-size 256 --ubatch-size 256  --threads $threads --cpu-strict 1 --cpu-range 0-7 --cpu-strict-batch 1 --threads-batch 8 --presence-penalty 1.0 --chat-template-kwargs '{"enable_thinking":true}' -fa on 

# --repeat-penalty 1.0 --presence-penalty 1.5 (1.0 - 1.5)  Use if looping is a problem