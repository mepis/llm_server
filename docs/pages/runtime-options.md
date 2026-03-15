---
title: Runtime Options
---
# Runtime Options

The llama.cpp CLI accepts a variety of command-line arguments to control model loading, generation parameters, and runtime behavior.

| Option | Example | Description |
|--------|---------|-------------|
| `-m <model>` | `-m models/llama.gguf` | Path to the GGUF model file to load. |
| `-n <n_predict>` | `-n 128` | Maximum number of tokens to generate. |
| `-c <n_ctx>` | `-c 2048` | Context size (number of tokens the model can attend to). |
| `-ngl <n_gpu_layers>` | `-ngl 30` | Number of layers to run on the GPU. |
| `-t <threads>` | `-t 8` | Number of CPU threads to use. |
| `-b <batch>` | `-b 512` | Batch size for prompt processing. |
| `--temp <temperature>` | `--temp 0.8` | Sampling temperature (higher = more random). |
| `--top_k <top_k>` | `--top_k 40` | Top‑k sampling cutoff. |
| `--top_p <top_p>` | `--top_p 0.9` | Nucleus sampling cutoff. |
| `--repeat_penalty <penalty>` | `--repeat_penalty 1.1` | Penalty to discourage token repetition. |
| `--presence_penalty <penalty>` | `--presence_penalty 0.5` | Penalty to discourage repeated presence of tokens. |
| `--frequency_penalty <penalty>` | `--frequency_penalty 0.3` | Penalty based on token frequency. |
| `--logit_bias <token_id>:<bias>` | `--logit_bias 5:1.5` | Add bias to logits for a specific token. |
| `--stop <token_id>` | `--stop 0` | Stop generation when this token appears. |
| `--seed <seed>` | `--seed 42` | Seed for the random number generator. |
| `--no_mmap` | `--no_mmap` | Disable memory‑mapped file loading. |
| `--use_mmap` | `--use_mmap` | Enable memory‑mapped file loading (default). |
| `--no_mlock` | `--no_mlock` | Disable memory locking. |
| `--mlock` | `--mlock` | Enable memory locking. |
| `--offline` | `--offline` | Run in offline mode (no network access). |
| `--verbose` | `--verbose` | Enable verbose logging. |
| `--quiet` | `--quiet` | Reduce log output. |
| `--color` | `--color` | Enable colored terminal output. |
| `--no_color` | `--no_color` | Disable colored terminal output. |
| `--interactive` | `--interactive` | Enable interactive mode (read from stdin). |
| `--no_interactive` | `--no_interactive` | Disable interactive mode. |
| `-h` or `--help` | `-h` | Show usage information and exit. |

> **Tip**: Run the binary with `-h` to see the full list of options and their default values.