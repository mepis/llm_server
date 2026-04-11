#!/bin/bash

# model=Qwen3.5-27B-IQ4_NL.sh
model=gemma-4-26B-A4B-it-MXFP4_MOE.sh
# model=Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q4_K_M.sh

CURRENT_DIR=$(pwd)
cd $CURRENT_DIR

$CURRENT_DIR/models/./$model