# ik_llama.cpp Build and Runtime Flags Documentation

This documentation covers all build-time and runtime flags for `ik_llama.cpp`, a fork of llama.cpp optimized for better CPU and hybrid GPU/CPU performance.

## Table of Contents

1. [Build Configuration](#build-configuration)
2. [Runtime Flags](#runtime-flags)
3. [GPU Offload and Split Modes](#gpu-offload-and-split-modes)
4. [Quantization Flags](#quantization-flags)
5. [Environment Variables](#environment-variables)

---

## Build Configuration

### CMake Build Options

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-DGGML_NATIVE=ON` | Enable native architecture optimizations | ON | Set to OFF when cross-compiling |
| `-DGGML_CUDA=ON` | Build with CUDA support | OFF | Requires CUDA toolkit |
| `-DCMAKE_CUDA_ARCHITECTURES=XX` | Specify CUDA compute capability | native | E.g., `86` for RTX 30-series |
| `-DGGML_RPC=ON` | Build RPC backend | OFF | Enables remote procedure calls |
| `-DGGML_IQK_FA_ALL_QUANTS=ON` | Include all IQK KV quantization types | OFF | Longer compile time |
| `-DLLAMA_SERVER_SQLITE3=ON` | Enable SQLite3 for mikupad | OFF | Required for mikupad UI |
| `-DGGML_BLAS=ON` | Enable BLAS acceleration | OFF | See BLAS section below |
| `-DGGML_BLAS_VENDOR=OpenBLAS` | BLAS library vendor | Generic | Options: OpenBLAS, Intel10_64lp |
| `-DGGML_OPENMP=ON` | Enable OpenMP support | OFF | Can improve performance |
| `-DGGML_AVX512=ON` | Enable AVX512 instructions | ON | Requires compatible CPU |
| `-DGGML_AVX512_VNNI=ON` | Enable AVX512 VNNI | ON | Requires compatible CPU |
| `-DGGML_AVX512_VBMI=ON` | Enable AVX512 VBMI | ON | Requires compatible CPU |
| `-DGGML_CUDA_USE_GRAPHS=ON` | Enable CUDA graphs | ON | Better performance on supported GPUs |
| `-DGGML_SCHED_MAX_COPIES=1` | Maximum scheduling copies | 2 | Reduces memory usage |
| `-DGGML_LLAMAFILE=OFF` | Disable llamafile support | ON | Required for Q4_0_4_4 quant |
| `-DGGML_METAL=ON` | Enable Metal (macOS) | ON | Disable with `GGML_NO_METAL=1` |
| `-DGGML_VULKAN=ON` | Enable Vulkan support | OFF | Requires Vulkan SDK |
| `-DGGML_HIPBLAS=ON` | Enable AMD ROCm support | OFF | Requires ROCm |
| `-DGGML_MUSA=ON` | Enable MUSA support | OFF | For Moore Threads GPUs |
| `-DGGML_NCCL=ON` | Enable NCCL for multi-GPU | ON | Disable with `-DGGML_NCCL=OFF` |

### BLAS Build Options

#### OpenBLAS
```bash
# Using make
make GGML_OPENBLAS=1

# Using CMake
cmake -B build -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS
cmake --build build --config Release
```

#### Intel oneMKL
```bash
# Source Intel environment
source /opt/intel/oneapi/setvars.sh

# Build with oneMKL
cmake -B build -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=Intel10_64lp \
      -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx -DGGML_NATIVE=ON
cmake --build build --config Release
```

### CUDA Build Options

```bash
# Basic CUDA build
make GGML_CUDA=1

# Using CMake
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release
```

### Windows Build (Clang + CUDA)

```bash
# Set environment variables
set VS_DIR=c:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools
call "%VS_DIR%\VC\Auxiliary\Build\vcvarsall.bat" x64
set LLVM_DIR=c:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Tools/Llvm/x64
set CUDA_DIR=C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v12.6
set "PATH=%LLVM_DIR%/bin;%CUDA_DIR%/bin;%PATH%"

# Build
cmake -G Ninja -S . -B build ^
  -DCMAKE_C_COMPILER="%LLVM_DIR%/bin/clang-cl.exe" ^
  -DCMAKE_CXX_COMPILER="%LLVM_DIR%/bin/clang-cl.exe" ^
  -DCMAKE_CUDA_COMPILER="%CUDA_DIR%/bin/nvcc.exe" ^
  -DCUDAToolkit_ROOT="%CUDA_DIR%" ^
  -DCMAKE_CUDA_ARCHITECTURES="89-real" ^
  -DCMAKE_BUILD_TYPE=Release ^
  -DGGML_CUDA=ON ^
  -DLLAMA_CURL=OFF ^
  -DCMAKE_C_FLAGS="/clang:-march=znver4 /clang:-fvectorize /clang:-ffp-model=fast" ^
  -DCMAKE_CXX_FLAGS="/EHsc /clang:-march=znver4 /clang:-fvectorize /clang:-ffp-model=fast" ^
  -DCMAKE_CUDA_STANDARD=17 ^
  -DGGML_AVX512=ON ^
  -DGGML_AVX512_VNNI=ON ^
  -DGGML_AVX512_VBMI=ON ^
  -DGGML_CUDA_USE_GRAPHS=ON ^
  -DGGML_SCHED_MAX_COPIES=1 ^
  -DGGML_OPENMP=ON

cmake --build build --config Release
```

### CUDA Compilation Environment Variables

| Variable | Description | Default | Legal Values |
|----------|-------------|---------|--------------|
| `CUDA_VISIBLE_DEVICES` | Specify which GPUs to use | All visible | Comma-separated device IDs |
| `GGML_CUDA_ENABLE_UNIFIED_MEMORY=1` | Enable unified memory (Linux) | OFF | Boolean |
| `GGML_CUDA_FORCE_DMMV` | Force dequantization + MV kernels | false | Boolean |
| `GGML_CUDA_DMMV_X` | X direction block size | 32 | Integer ≥ 32, power of 2 recommended |
| `GGML_CUDA_MMV_Y` | Y direction block size | 1 | Integer, power of 2 recommended |
| `GGML_CUDA_FORCE_MMQ` | Force MMQ kernels (int8 tensor cores) | false | Boolean |
| `GGML_CUDA_FORCE_CUBLAS` | Force FP16 cuBLAS | false | Boolean |
| `GGML_CUDA_F16` | Use FP16 arithmetic | false | Boolean |
| `GGML_CUDA_KQUANTS_ITER` | Iterations for Q2_K/Q6_K | 2 | 1 or 2 |
| `GGML_CUDA_PEER_MAX_BATCH_SIZE` | Max batch size for peer access | 128 | Integer |
| `GGML_CUDA_FA_ALL_QUANTS` | All KV quant types for FlashAttention | false | Boolean |

### HIP/ROCm Build Options

```bash
# Linux build
HIPCXX="$(hipconfig -l)/clang" HIP_PATH="$(hipconfig -R)" \
    cmake -B build -DGGML_HIPBLAS=ON -DAMDGPU_TARGETS=gfx1030 \
          -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -- -j 16

# With UMA (unified memory architecture)
cmake -B build -DGGML_HIPBLAS=ON -DAMDGPU_TARGETS=gfx1030 \
      -DGGML_HIP_UMA=ON -DCMAKE_BUILD_TYPE=Release
```

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `AMDGPU_TARGETS` | GPU architecture to compile for | - | E.g., `gfx1030`, `gfx1100` |
| `GGML_HIP_UMA=ON` | Enable unified memory | OFF | Hurts performance on discrete GPUs |
| `HIP_VISIBLE_DEVICES` | Specify which AMD GPUs to use | All | Comma-separated device IDs |
| `HSA_OVERRIDE_GFX_VERSION` | Override GPU version | - | E.g., `10.3.0` for RDNA2 |

---

## Runtime Flags

### General Parameters

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-h, --help, --usage` | Print usage and exit | - | - |
| `-t, --threads N` | Threads for generation | 4 | Match physical CPU cores, avoid odd numbers |
| `-tb, --threads-batch N` | Threads for batch processing | Same as `--threads` | Lower for full GPU offload |
| `-c, --ctx-size N` | Context size | 0 (model default) | Affects KV cache size (2048, 4096, ...) |
| `-n, --predict N` | Tokens to predict | -1 (infinity) | -1=∞, -2=context fill |
| `-b, --batch-size N` | Max logical batch size | 2048 | Higher = better t/s on GPU |
| `-ub, --ubatch-size N` | Max physical batch size | 512 | Similar to `--batch-size` |
| `--keep N` | Tokens to keep from prompt | 0 | -1 = all |
| `--chunks N` | Max chunks to process | -1 (all) | - |
| `-fa, --flash-attn` | Enable Flash Attention | auto | on/off/auto - improves t/s, reduces memory |
| `--no-fa, --no-flash-attn` | Disable Flash Attention | - | - |
| `--mlock` | Keep model in RAM | - | Prevents swapping |
| `--no-mmap` | Disable memory mapping | - | Slower load, fewer pageouts |
| `--no-warmup` | Skip model warmup | - | - |

### Context and KV Cache

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-dkvc, --dump-kv-cache` | Verbose KV cache print | - | - |
| `-nkvo, --no-kv-offload` | Keep KV on CPU | - | Reduces PP speed |
| `-ctk, --cache-type-k TYPE` | KV cache K type | f16 | Reduces K size, may reduce quality |
| `-ctv, --cache-type-v TYPE` | KV cache V type | f16 | See `--cache-type-k` |
| `--no-context-shift` | Disable context shift | - | - |
| `--context-shift` | Enable context shift | auto | on/off/0/1 |
| `--ctx-checkpoints N` | Checkpoints per slot | - | For recurrent models (Qwen3-Next, Qwen3.5-MoE) |
| `--ctx-checkpoints-interval N` | Min tokens between checkpoints | - | During TG saves at this interval |

### Speculative Decoding

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-td, --threads-draft N` | Threads for draft model | Same as `--threads` | - |
| `-tbd, --threads-batch-draft N` | Batch threads for draft | Same as `--threads-draft` | - |
| `-ps, --p-split N` | Speculative split probability | 0.1 | - |
| `-cd, --ctx-size-draft N` | Draft context size | 0 (model default) | - |
| `-ctkd, --cache-type-k-draft TYPE` | Draft K cache type | - | See `--cache-type-k` |
| `-ctvd, --cache-type-v-draft TYPE` | Draft V cache type | - | See `--cache-type-k` |
| `-draft, --draft-params` | Draft model parameters | - | Comma-separated |
| `--spec-ngram-size-n N` | NGram size N | 12 | Length of lookup n-gram |
| `--spec-ngram-size-m N` | NGram size M | 48 | Length of draft m-gram |
| `--spec-ngram-min-hits N` | Min NGram hits | 1 | - |
| `--spec-type TYPE` | Speculative type | - | none/ngram-cache/ngram-simple/ngram-map-k/ngram-map-k4v/ngram-mod |
| `-mtp, --multi-token-prediction` | MTP decoding | - | For GLM-4.x MoE |
| `-no-mtp, --no-multi-token-prediction` | Disable MTP | - | - |
| `--draft-max N` | Max draft tokens | 16 | - |
| `--draft-p-min P` | Min draft probability | 0.8 | Greedy mode |
| `--draft-min N` | Min draft tokens | - | - |
| `-md, --model-draft FNAME` | Draft model file | unused | - |

### Sampling Parameters

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--samplers SAMPLERS` | Samplers in order | dry;top_k;tfs_z;typical_p;top_p;min_p;xtc;top_n_sigma;temperature;adaptive_p | Semicolon separated |
| `--sampling-seq SEQUENCE` | Simplified sampler sequence | dkfypmxntw | - |
| `--banned-string-file FILE` | File with banned strings | - | One string per line |
| `--banned-n N` | Tokens banned during rewind | -1 | -1=all tokens |

### Prompt Template

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--jinja` | Custom Jinja template | Model metadata | Mandatory for tool calling |
| `--chat-template TEMPLATE` | Jinja chat template | Disabled | E.g., `chatml` |
| `--chat-template-file FILE` | Load template from file | - | Useful for template fixes |
| `--chat-template-kwargs JSON` | Template parser kwargs | - | E.g., `{"reasoning_effort": "medium"}` |
| `--reasoning-format FORMAT` | Thought tag handling | none | none/deepseek/deepseek-legacy |
| `--reasoning-budget N` | Thinking token limit | -1 (unrestricted) | 0 disables thinking |
| `--reasoning-tokens FORMAT` | Reasoning token selection | auto | - |

### Parallel Processing

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-np, --parallel N` | Parallel sequences | 1 | Useful for multi-user frontends |

### Cache RAM

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-cram, --cache-ram N` | Max cache size (MiB) | 8192 | -1=no limit, 0=disable |
| `-crs, --cache-ram-similarity N` | Similarity threshold | 0.50 | Triggers cache |
| `-cram-n-min, --cache-ram-n-min N` | Min cached tokens | 0 | - |

---

## GPU Offload and Split Modes

### Basic GPU Offload

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-ngl, --gpu-layers N` | Layers in VRAM | - | Use 999 for full offload |
| `-ngld, --gpu-layers-draft N` | Draft layers in VRAM | - | For draft model |
| `-mg, --main-gpu i` | Main GPU (split=none) | - | - |
| `-ts, --tensor-split SPLIT` | GPU fraction split | - | Comma-separated, e.g., `3,1` |
| `-dev, --device DEVICES` | Devices to use | none | E.g., `CUDA0,CUDA1` |
| `-devd, --device-draft DEVICES` | Draft devices | none | For draft model |

### Split Modes

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-sm, --split-mode MODE` | Multi-GPU split mode | none | none/graph/layer |
| `-smf16, --split-mode-f16` | Use FP16 for GPU exchange | 1 | - |
| `-smf32, --split-mode-f32` | Use FP32 for GPU exchange | 0 | - |
| `-grt, --graph-reduce-type TYPE` | Data exchange type | f32 | q8_0/bf16/f16/f32 |
| `-smgs, --split-mode-graph-scheduling` | Force graph scheduling | 0 | - |
| `--max-gpu N` | Max GPUs per layer | - | For graph mode |

### MoE Offload

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--cpu-moe` | Keep all MoE weights on CPU | - | Simple MoE offload |
| `--n-cpu-moe N` | First N MoE layers on CPU | - | Partial MoE offload |
| `-ooae, --offload-only-active-experts` | Offload only active experts | ON | Reduces RAM→VRAM transfer |
| `-no-ooae` | Disable offload-only-active | - | - |

### Tensor Overrides

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-ot, --override-tensor REGEX=TARGET` | Override tensor storage | - | Regex pattern, e.g., `\.ffn_.*_exps\.=CPU` |

### Offload Policy

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-op, --offload-policy PAIRS` | Manual offload policy | - | `-op a1,b1,a2,b2...` |

**Offload Policy Values:**
- `-op -1,0`: Disable all GPU offload
- `-op 26,0`: Disable matrix multiplication offload
- `-op 27,0`: Disable indirect matrix multiplication (MoE experts)
- `-op 29,0`: Disable fused up-gate-unary offload

### CUDA-Specific Runtime Flags

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-cuda, --cuda-params PARAMS` | CUDA parameters | - | Fusion, offload threshold, MMQ-ID |
| `-cuda fa-offset=value` | FP16 precision offset | 0 | Interval [0...3], fixes f16 overflow |
| `-cuda graphs=0` | Disable CUDA graphs | - | Fix gibberish with split mode graph |

---

## Model Options

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-m, --model FNAME` | Model path | models/$filename | Required |
| `--check-tensors` | Check tensor validity | false | - |
| `--override-kv KEY=TYPE:VALUE` | Override metadata | - | int/float/bool/str, e.g., `tokenizer.ggml.add_bos_token=bool:false` |

---

## Server Options

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--host HOST` | Listen address | 127.0.0.1 | Use 0.0.0.0 for network access |
| `--port PORT` | Port | 8080 | - |
| `--webui NAME` | WebUI to serve | auto | none/auto/llamacpp |
| `--api-key KEY` | API key | none | For authentication |
| `-a, --alias NAME` | Model alias | none | For REST API |

---

## Quantization Flags

### Quantization Tools

```bash
# Quantize model
llama-quantize --imatrix /models/model.imatrix \
               /models/model-bf16.gguf \
               /models/model-IQ4_NL.gguf \
               IQ4_NL

# Split model
llama-gguf-split --split --split-max-size 1G \
                 --no-tensor-first-split \
                 /models/model-IQ4_NL.gguf \
                 /models/parts/model-IQ4_NL.gguf
```

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--custom-q REGEX=TYPE` | Custom quantization rules | - | `regex1=type1,regex2=type2...` |
| `--dry-run` | Print tensor types/sizes | - | Don't run quantization |
| `--partial-requant` | Quantize missing splits | - | - |

### IQK KV Quantization

Build with `-DGGML_IQK_FA_ALL_QUANTS=ON` to access more KV quant types:
- F16, Q8_0, Q6_0, BF16 (default)
- Additional types with IQK build flag

---

## Benchmark Tools

### sweep_bench

```bash
llama-sweep-bench -m /models/model.gguf -c 12288 -ub 512 -rtr -fa -ctk q8_0 -ctv q8_0
```

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-nrep N, --n-repetitions N` | Repetitions at zero context | - | - |
| `-n N` | TG tokens | - | Default: ubatch/4 |

### llama-bench

```bash
llama-bench -tgb 4,16 -p 512 -n 128 other_arguments
```

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `-tgb, --threads-gen-batch` | Different threads for gen/batch | - | - |

### Imatrix

```bash
llama-imatrix -m /models/model-bf16.gguf \
              -f /models/calibration_data.txt \
              -o /models/model.imatrix
```

| Flag | Description | Default | Notes |
|------|-------------|---------|-------|
| `--layer-similarity, -lsim` | Layer activation similarity | - | Cosine similarity |
| `--hide-imatrix` | Hide imatrix metadata | - | - |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CUDA_VISIBLE_DEVICES` | Select which GPUs to use | `CUDA_VISIBLE_DEVICES=0,2` |
| `HIP_VISIBLE_DEVICES` | Select which AMD GPUs to use | `HIP_VISIBLE_DEVICES=0` |
| `GGML_CUDA_ENABLE_UNIFIED_MEMORY=1` | Enable unified memory (Linux) | `1` |
| `HSA_OVERRIDE_GFX_VERSION` | Override AMD GPU version | `10.3.0` |

---

## Performance Tips

### Optimal CPU Thread Count
```bash
# Match physical cores, avoid odd numbers
-t 8 -tb 8  # For 8-core system
```

### Full GPU Offload
```bash
# Load entire model to GPU
-ngl 999 -fa on
```

### Hybrid CPU/GPU (Large Models)
```bash
# Quantize KV cache to save VRAM
-ctk q8_0 -ctv q8_0 -fa on

# Custom tensor placement for MoE
-ot "blk.(?:[0-9]|[1-9][0-9]).ffn._exps.=CPU"
```

### Flash Attention for Long Context
```bash
# Fix FP16 overflow in long contexts
-cuda fa-offset=1.5
```

### Multi-GPU Setup
```bash
# Graph mode (best for multi-GPU)
-sm graph -ts 1,1,1

# Layer mode (simpler)
-sm layer -ts 1,1
```

### MoE Optimization
```bash
# Keep experts on CPU, offload attention to GPU
--cpu-moe

# Or selective offload
--n-cpu-moe 10

# Only offload active experts
-ooae
```

---

## Common Model-Specific Configurations

### DeepSeek Models (MLA)
```bash
# Enable MLA
-mla 3

# FlashMLA for CUDA (Ampere+)
-mla 3 -fa on

# FlashMLA for CPU (fastest)
-mla 3 -fa on
```

### Qwen3-MoE Models
```bash
# Full offload
-ngl 999 -fa on

# Fused MoE operations
-fmoe

# Or keep experts on CPU
--cpu-moe
```

### GLM-4.x MoE (MTP)
```bash
# Multi-token prediction
-mtp

# With draft tokens
--draft-max 32 --draft-p-min 0.9
```

### Bitnet Models
```bash
# Note: Do not use Unsloth _XL models with f16 tensors
# Use standard quantization for best compatibility
```

---

## Troubleshooting

### Gibberish Output with Split Mode Graph
```bash
# Disable CUDA graphs
-cuda graphs=0
```

### Insufficient VRAM
```bash
# Reduce GPU layers
-ngl 20

# Quantize KV cache
-ctk q8_0 -ctv q8_0

# Keep KV on CPU (not recommended)
-nkvo
```

### FP16 Overflow in Long Contexts
```bash
# Increase FP16 precision offset
-cuda fa-offset=1.0
# Or try 1.5, 2.0, up to 3.0
```

### Slow MoE Performance
```bash
# Enable fused MoE
-fmoe

# Offload only active experts
-ooae

# Keep experts on CPU
--cpu-moe
```

### CUDA Graph Issues
```bash
# Disable CUDA graphs
-cuda graphs=0

# Or adjust graph reuse
--no-gr
```

---

## References

- [Original Repository](https://github.com/ikawrakow/ik_llama.cpp)
- [Discussion: DeepSeek Models](https://github.com/ikawrakow/ik_llama.cpp/discussions/258)
- [Discussion: New Quantization Types](https://github.com/ikawrakow/ik_llama.cpp/discussions/8)
- [Wiki: Performance Comparisons](https://github.com/ikawrakow/ik_llama.cpp/wiki)
