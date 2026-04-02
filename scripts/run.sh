#!/bin/bash

CURRENT_DIR=$(pwd)
cd $CURRENT_DIR

# ./model_profiles/run_qwen3.5-35-q8.sh
# ./model_profiles/run_Nemotron-3-Nano-30B-A3B-IQ4_NL.sh
# ./model_profiles/run_nvidia_Nemotron-Cascade-2-30B-A3B-Q6_K_L.sh
# ./model_profiles/run_Qwen3.5-27B-IQ4_NL.sh
# ./model_profiles/run_Qwen3-Coder-Next-MXFP4_MOE.sh
# $CURRENT_DIR/git/llm_server/scripts/./run_Qwen3.5-9B-IQ4_NL.sh
$CURRENT_DIR/git/llm_server/scripts/./run_gemma-4-26B-A4B-it-MXFP4_MOE.sh