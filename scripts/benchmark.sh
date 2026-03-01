#!/bin/bash 

./llama-bench -m ~/llm_server/models/unsloth_Qwen3.5-27B-GGUF_Qwen3.5-27B-Q4_K_S.gguf --split-mode layer --tensor-split 16,12,12 --main-gpu 0 -n 2048 -b 1024 -ub 128 -ctk q4_0