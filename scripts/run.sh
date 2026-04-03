#!/bin/bash

# model=run_qwen3.5-35-q8.sh
# model=run_Nemotron-3-Nano-30B-A3B-IQ4_NL.sh
# model=run_nvidia_Nemotron-Cascade-2-30B-A3B-Q6_K_L.sh
# model=run_Qwen3.5-27B-IQ4_NL.sh
# model=run_Qwen3-Coder-Next-MXFP4_MOE.sh
# model=run_Qwen3.5-9B-IQ4_NL.sh
model=run_gemma-4-26B-A4B-it-MXFP4_MOE.sh

CURRENT_DIR=$(pwd)
cd $CURRENT_DIR

$CURRENT_DIR/.llm_server/models/./$model