# llama.cpp Flags and Configuration Reference

Comprehensive documentation for build-time and runtime flags for [llama.cpp](https://github.com/ggml-org/llama.cpp), the upstream repository for ik_llama.cpp.

## Table of Contents

- [Build Configuration](#build-configuration)
  - [CMake Build Options](#cmake-build-options)
  - [GPU Backend Options](#gpu-backend-options)
  - [CPU Backend Options](#cpu-backend-options)
- [Runtime Flags](#runtime-flags)
  - [llama-cli Parameters](#llama-cli-parameters)
  - [llama-server Parameters](#llama-server-parameters)
- [GPU Offload Configuration](#gpu-offload-configuration)
- [Quantization](#quantization)
- [Tools](#tools)
- [Environment Variables](#environment-variables)
- [Model-Specific Configuration](#model-specific-configuration)
- [Troubleshooting](#troubleshooting)
- [Differences from ik_llama.cpp](#differences-from-ik_llamacpp)

## Build Configuration

### CMake Build Options

#### Basic Build Setup

```bash
# Create build directory
mkdir -p build && cd build

# Configure with CMake
cmake ..

# Build
cmake --build . --config Release
```

#### Platform-Specific Presets

```bash
# macOS with Metal
cmake --preset macos

# Linux with CUDA
cmake --preset cuda

# Linux with ROCm
cmake --preset rocm

# Windows with CUDA
cmake --preset windows-cuda

# Windows with DirectML
cmake --preset windows-directml
```

#### Manual CMake Configuration

```bash
cmake .. \
  -DGGML_CUDA=ON \
  -DGGML_CUBLAS=ON \
  -DCMAKE_BUILD_TYPE=Release
```

### GPU Backend Options

#### CUDA (NVIDIA GPUs)

```bash
cmake .. -DGGML_CUDA=ON -DGGML_CUBLAS=ON
```

**Environment Variables:**
- `GGML_CUDA=ON` - Enable CUDA support
- `GGML_CUDA_FORCE_MMQ=true` - Force use of MMQ instructions for older GPUs
- `CUDA_ARCHITECTURES` - Target CUDA architecture (e.g., `86` for RTX 30xx)

**Notes:**
- Requires NVIDIA CUDA Toolkit (version 11.8+ recommended)
- Supports all modern NVIDIA GPUs
- Best performance on RTX 30xx/40xx series

#### HIP/ROCm (AMD GPUs)

```bash
cmake .. -DGGML_HIP=ON -DGGML_ROCM=ON -DHIP_PATH=/opt/rocm
```

**Environment Variables:**
- `GGML_HIP=ON` - Enable HIP support
- `GGML_ROCM=ON` - Enable ROCm backend
- `HIP_PATH` - ROCm installation path

**Notes:**
- Requires AMD ROCm toolkit (5.6+ recommended)
- Supports RX 7000 series, MI250X, MI300X
- Limited support for older AMD GPUs

#### Vulkan

```bash
cmake .. -DGGML_VULKAN=ON
```

**Environment Variables:**
- `GGML_VULKAN=ON` - Enable Vulkan support

**Notes:**
- Cross-platform GPU acceleration
- Good for AMD and Intel integrated GPUs
- Lower performance than CUDA/Metal

#### Metal (macOS)

```bash
# Automatic on macOS, or explicitly:
cmake --preset macos
```

**Environment Variables:**
- `GGML_METAL=ON` - Enable Metal support (default on macOS)
- `MPS_MEMORY_LIMIT` - Limit MPS memory usage

**Notes:**
- Built into macOS SDK
- Optimized for Apple Silicon (M1/M2/M3)
- Supports all Mac with Metal support

#### SYCL (Intel GPUs)

```bash
cmake .. -DGGML_SYCL=ON -DSYCL_ARCH=xe2
```

**Environment Variables:**
- `GGML_SYCL=ON` - Enable SYCL support
- `SYCL_ARCH` - Target architecture (e.g., `xe2` for Battlemage)

**Notes:**
- Requires Intel oneAPI Base Toolkit
- Supports Intel Arc GPUs
- Supports CPU offload to Intel CPUs

#### BLAS (CPU optimization)

```bash
cmake .. -DGGML_BLAS=ON -DBLAS_VENDOR=OpenBLAS
```

**BLAS Options:**
- `OpenBLAS` - Open source BLAS library
- `BLIS` - BLIS library
- `System` - System BLAS
- `Apple` - Apple Accelerate framework (macOS)
- `MKL` - Intel MKL

**Notes:**
- Significant CPU performance improvement
- Recommended for CPU-only builds

### CPU Backend Options

#### AVX/AVX2/AVX512 (x86-64)

```bash
cmake .. -DGGML_AVX=ON -DGGML_AVX2=ON -DGGML_AVX512=ON
```

**Environment Variables:**
- `GGML_AVX` - Enable AVX
- `GGML_AVX2` - Enable AVX2
- `GGML_AVX512` - Enable AVX512

**Notes:**
- Enabled by default on x86-64
- Progressive fallback for older CPUs

#### NEON (ARM)

```bash
cmake .. -DGGML_NEON=ON
```

**Environment Variables:**
- `GGML_NEON` - Enable NEON (default on ARM)

**Notes:**
- Built into ARM CPUs
- Used by Apple Silicon, Raspberry Pi, Android

## Runtime Flags

### llama-cli Parameters

#### Basic Inference

```bash
llama-cli -m <model.gguf> \
  -p "<prompt>" \
  -n <tokens> \
  --temp <temperature> \
  --top-k <k> \
  --top-p <p> \
  --repeat-last-n <n> \
  --repeat-penalty <penalty>
```

**Core Parameters:**

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --model <path>` | required | Path to model file |
| `-p, --prompt <text>` | "" | Prompt for completion |
| `-n, --n-tokens <n>` | 200 | Number of tokens to generate |
| `-c, --ctx-size <n>` | 512 | Context size |
| `-t, --threads <n>` | auto | Number of threads |
| `-b, --batch-size <n>` | 512 | Batch size |
| `-ngl, --n-gpu-layers <n>` | 0 | Layers to offload to GPU |
| `-s, --seed <n>` | 42 | RNG seed |

#### Sampling Parameters

| Flag | Default | Description |
|------|---------|-------------|
| `--temp <float>` | 0.8 | Temperature |
| `--top-k <n>` | 40 | Top-k sampling |
| `--top-p <float>` | 0.9 | Top-p (nucleus) sampling |
| `--min-p <float>` | 0.05 | Min-p sampling |
| `--typical-p <float>` | 1.0 | Locally typical sampling |
| `--repeat-last-n <n>` | 64 | Last n tokens to consider for penalty |
| `--repeat-penalty <float>` | 1.0 | Penalty for repeated tokens |
| `--presence-penalty <float>` | 0.0 | Presence penalty |
| `--frequency-penalty <float>` | 0.0 | Frequency penalty |
| `--mirostat <n>` | 0 | Mirostat sampling (0=off, 1=classic, 2=2.0) |
| `--mirostat-lr <float>` | 0.1 | Mirostat learning rate |
| `--mirostat-ent <float>` | 5.0 | Mirostat target entropy |

#### Model Loading

| Flag | Default | Description |
|------|---------|-------------|
| `--lora <path>` | "" | Path to LoRA adapter |
| `--lora-scale <float>` | 1.0 | LoRA scale |
| `--control-vector <path>` | "" | Control vector path |
| `--control-vector-strength <float>` | 1.0 | Control vector strength |
| `--mmproj <path>` | "" | Path to multimodal projector |

#### Performance

| Flag | Default | Description |
|------|---------|-------------|
| `--cpu-mask <hex>` | "" | CPU affinity mask |
| `--cpu-threads <n>` | auto | Number of CPU threads |
| `--split-mode <mode>` | layer | Split mode (layer, row, none) |
| `--tensor-split <ratio>` | auto | Split tensors across multiple GPUs |
| `--no-mmap` | false | Disable memory mapping |
| `--mlock` | false | Force model to stay in RAM |
| `--no-kv-cache-eviction` | false | Disable KV cache eviction |

#### Output

| Flag | Default | Description |
|------|---------|-------------|
| `-v, --verbose` | false | Verbose output |
| `-c, --color` | auto | Colorize output |
| `-r, --reverse-prompt` | "" | Reverse prompt to stop on |
| `--log-file <path>` | "" | Log file path |
| `--log-disable` | false | Disable logging |

### llama-server Parameters

#### Server Configuration

```bash
llama-server -m <model.gguf> \
  --host <address> \
  --port <port> \
  --ctx-size <size> \
  --threads <n> \
  --n-gpu-layers <n>
```

**Server Parameters:**

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --model <path>` | required | Path to model file |
| `--host <address>` | 127.0.0.1 | Server host |
| `--port <port>` | 8080 | Server port |
| `-c, --ctx-size <n>` | 2048 | Context size |
| `-t, --threads <n>` | auto | Number of threads |
| `-b, --batch-size <n>` | 512 | Batch size |
| `-ngl, --n-gpu-layers <n>` | 0 | Layers to offload to GPU |

#### API Configuration

| Flag | Default | Description |
|------|---------|-------------|
| `--api-key <key>` | "" | API key for authentication |
| `--api-log` | false | Log API requests |
| `--api-cors` | false | Enable CORS |
| `--api-prefix <path>` | / | API prefix |

#### Chat and Completion

| Flag | Default | Description |
|------|---------|-------------|
| `--chat-file <path>` | "" | Chat template file |
| `--completion-prompt <text>` | "" | Completion prompt template |
| `--system-prompt <text>` | "" | System prompt |
| `--jinja` | false | Use Jinja chat templates |

#### Sampling (same as CLI)

| Flag | Default | Description |
|------|---------|-------------|
| `--temp <float>` | 0.8 | Temperature |
| `--top-k <n>` | 40 | Top-k sampling |
| `--top-p <float>` | 0.9 | Top-p sampling |
| `--repeat-last-n <n>` | 64 | Repeat last N tokens |
| `--repeat-penalty <float>` | 1.0 | Repeat penalty |

#### Performance Tuning

| Flag | Default | Description |
|------|---------|-------------|
| `--tensor-split <ratio>` | auto | Tensor split across GPUs |
| `--split-mode <mode>` | layer | Split mode |
| `--numa <mode>` | false | NUMA optimization |
| `--memory-f32` | false | Use f32 for key/value cache |
| `--low-vram` | false | Low VRAM mode |
| `--no-mmap` | false | Disable memory mapping |
| `--mlock` | false | Lock model in RAM |

#### Advanced Features

| Flag | Default | Description |
|------|---------|-------------|
| `--chat-template <path>` | "" | Custom chat template |
| `--conversation` | false | Conversation mode |
| `--slot-drain-step` | -1 | Slot drain step |
| `--slot-save-period` | 0 | Slot save period |
| `--cohere` | false | Cohere API mode |
| `--embedding` | false | Embedding mode |
| `--rtn` | false | Round to nearest |

## GPU Offload Configuration

### Layer Offload

```bash
# Offload all layers to GPU
-ngl 100

# Offload specific number of layers
-ngl 32

# Dynamic offload
-ngl auto
```

### Multi-GPU Setup

```bash
# Split layers across GPUs
--tensor-split 1,1  # Equal split for 2 GPUs
--tensor-split 2,1  # 2:1 ratio for 2 GPUs

# Example with 4 GPUs
--tensor-split 1,1,1,1
```

### Split Modes

```bash
# Layer split (default) - splits by transformer layers
--split-mode layer

# Row split - splits by row (better for attention)
--split-mode row

# No split - use single GPU
--split-mode none
```

### GPU Memory Management

```bash
# Lock model in RAM (prevents swapping)
--mlock

# Disable memory mapping
--no-mmap

# Low VRAM mode (evicts unused layers)
--low-vram

# Force MMQ for older GPUs
GGML_CUDA_FORCE_MMQ=1
```

## Quantization

### Quantization Tools

```bash
# Quantize a model
llama-quantize <input.gguf> <output.gguf> <quantization>

# List available quantizations
llama-quantize --help
```

### Quantization Types

| Type | Description | Use Case |
|------|-------------|----------|
| `Q4_0` | 4-bit quantization | Balanced quality/size |
| `Q4_1` | 4-bit with extra metadata | Better perplexity |
| `Q5_0` | 5-bit quantization | Higher quality |
| `Q5_1` | 5-bit with extra metadata | Best 5-bit |
| `Q8_0` | 8-bit quantization | Near-original quality |
| `Q2_K` | 2-bit K-quants | Smallest size |
| `Q3_K_S` | 3-bit small K-quants | Small models |
| `Q3_K_M` | 3-bit medium K-quants | Balanced |
| `Q3_K_L` | 3-bit large K-quants | Better quality |
| `Q4_K_S` | 4-bit small K-quants | Recommended |
| `Q4_K_M` | 4-bit medium K-quants | Best balance |
| `Q5_K_S` | 5-bit small K-quants | High quality |
| `Q5_K_M` | 5-bit medium K-quants | Best 5-bit |
| `Q6_K` | 6-bit K-quants | Very high quality |
| `Q8_0` | 8-bit K-quants | Near lossless |

### Quantization Examples

```bash
# Create balanced 4-bit model
llama-quantize model-f16.gguf model-q4_k_m.gguf Q4_K_M

# Create small 3-bit model
llama-quantize model-f16.gguf model-q3_k_m.gguf Q3_K_M

# Create high-quality 8-bit model
llama-quantize model-f16.gguf model-q8_0.gguf Q8_0

# Quantize with custom tokeniser
llama-quantize --vocab-only model-f16.gguf vocab.gguf
```

### Quantization Parameters

```bash
# Quantize with specific method
llama-quantize -q Q4_K_M input.gguf output.gguf

# Skip quantizing certain layers
llama-quantize --skip-quantize "attention.*|output.*" input.gguf output.gguf
```

## Tools

### llama-cli

**Purpose:** Command-line inference tool

**Basic Usage:**
```bash
llama-cli -m model.gguf -p "Hello, how are you?" -n 256
```

**Interactive Mode:**
```bash
llama-cli -m model.gguf -c 2048 -t 4 --interactive
```

### llama-server

**Purpose:** OpenAI-compatible API server

**Basic Usage:**
```bash
llama-server -m model.gguf -p 8080 -c 2048
```

**Curl Example:**
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "default",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7
  }'
```

### llama-bench

**Purpose:** Performance benchmarking

**Basic Usage:**
```bash
llama-bench -m model.gguf -t 4 -c 2048
```

**Benchmark Options:**
```bash
llama-bench --help
```

### llama-perplexity

**Purpose:** Calculate model perplexity

**Basic Usage:**
```bash
llama-perplexity -m model.gguf -f test.txt -c 2048 -t 4
```

### llama-simple

**Purpose:** Simple inference tool

**Basic Usage:**
```bash
llama-simple -m model.gguf -p "Hello"
```

### llama-quantize

**Purpose:** Quantize models

**Basic Usage:**
```bash
llama-quantize model-f16.gguf model-q4.gguf Q4_0
```

### llama-imatrix

**Purpose:** Calculate importance matrix for quantization

**Basic Usage:**
```bash
llama-imatrix -m model.gguf -f data.txt -o imatrix.gguf
```

### llama-export-lora

**Purpose:** Export LoRA adapters

**Basic Usage:**
```bash
llama-export-lora model.gguf lora.gguf 1.0
```

### llama-load-python

**Purpose:** Python model loading

**Basic Usage:**
```bash
llama-load-python -m model.gguf
```

## Environment Variables

### General

| Variable | Default | Description |
|----------|---------|-------------|
| `LLAMA_CACHE` | `~/.cache/llama-cache` | Cache directory |
| `LLAMA_LOG_LEVEL` | `info` | Log level (trace, debug, info, warn, error) |
| `LLAMA_LOG_FILE` | "" | Log file path |
| `LLAMA_BACKEND` | auto | Backend selection |

### CUDA

| Variable | Default | Description |
|----------|---------|-------------|
| `GGML_CUDA` | auto | Enable CUDA |
| `GGML_CUDA_FORCE_MMQ` | false | Force MMQ instructions |
| `CUDA_VISIBLE_DEVICES` | all | Visible CUDA devices |
| `CUDA_DEVICE_ORDER` | PCI_BUS_ID | Device ordering |
| `CUBLAS_WORKSPACE_CONFIG` | :4096:8 | CUBLAS workspace config |

### ROCm

| Variable | Default | Description |
|----------|---------|-------------|
| `GGML_HIP` | auto | Enable HIP |
| `GGML_ROCM` | auto | Enable ROCm |
| `HIP_VISIBLE_DEVICES` | all | Visible HIP devices |

### Metal

| Variable | Default | Description |
|----------|---------|-------------|
| `GGML_METAL` | auto | Enable Metal |
| `MPS_MEMORY_LIMIT` | 0 | MPS memory limit (MB) |

### Vulkan

| Variable | Default | Description |
|----------|---------|-------------|
| `GGML_VULKAN` | auto | Enable Vulkan |
| `VULKAN_DEVICE` | auto | Vulkan device index |

### SYCL

| Variable | Default | Description |
|----------|---------|-------------|
| `GGML_SYCL` | auto | Enable SYCL |
| `SYCL_DEVICE_FILTER` | auto | SYCL device filter |

### Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `OMP_NUM_THREADS` | auto | OpenMP threads |
| `KMP_AFFINITY` | compact | Intel thread affinity |
| `MKL_NUM_THREADS` | auto | MKL threads |

## Model-Specific Configuration

### LLaMA 3

```bash
llama-server -m llama-3-8b.gguf \
  --chat-file chat-llama-3.json \
  -c 8192 \
  --temp 0.7
```

### Qwen

```bash
llama-server -m qwen2-7b.gguf \
  --chat-template qwen \
  -c 4096 \
  --jinja
```

### DeepSeek

```bash
llama-server -m deepseek-llm-7b.gguf \
  --flash-attn \
  -c 4096
```

### Mistral

```bash
llama-server -m mistral-7b.gguf \
  --chat-file chat-mistral.json \
  -c 8192
```

### LLaVA (Multimodal)

```bash
llama-server -m llava-v1.5-7b.gguf \
  --mmproj llava-v1.5-7b-projector.gguf \
  -c 2048
```

## Troubleshooting

### CUDA Issues

**Problem:** CUDA out of memory
**Solution:**
```bash
# Reduce GPU layers
-ngl 30

# Enable low VRAM mode
--low-vram

# Use smaller batch size
-b 256
```

**Problem:** CUDA startup failure
**Solution:**
```bash
# Check CUDA version
nvcc --version

# Verify GPU drivers
nvidia-smi

# Try MMQ mode
GGML_CUDA_FORCE_MMQ=1
```

### ROCm Issues

**Problem:** ROCm not detected
**Solution:**
```bash
# Check ROCm installation
rocm-smi

# Verify HIP path
cmake .. -DHIP_PATH=/opt/rocm
```

### Metal Issues

**Problem:** Metal memory limit
**Solution:**
```bash
# Limit MPS memory
export MPS_MEMORY_LIMIT=4096
```

### Performance Issues

**Problem:** Slow inference
**Solution:**
```bash
# Increase threads
-t 8

# Use larger batch size
-b 512

# Enable memory mapping
--mlock

# Use BLAS
cmake .. -DGGML_BLAS=ON
```

### Quantization Issues

**Problem:** Poor quantization quality
**Solution:**
```bash
# Use higher quantization
Q4_K_M -> Q5_K_M

# Use importance matrix
llama-imatrix -m model.gguf -f data.txt
llama-quantize --imatrix imatrix.gguf ...
```

## Differences from ik_llama.cpp

### Features in ik_llama.cpp (Not in Upstream)

1. **IQK Quantizations**
   - IQ2_XXS, IQ2_XS, IQ3_XXS
   - Advanced quantization methods

2. **Trellis Quantizations**
   - Trellis-specific quantization formats

3. **FlashMLA for DeepSeek**
   - Optimized attention for DeepSeek models

4. **Graph Split Mode**
   - Custom graph splitting for better performance

5. **Custom Build Scripts**
   - `scripts/build_qwen3.5-35-q8.sh`
   - `scripts/build_qwen3.5-35-q6-k-s.sh`

6. **IK-Specific Environment Variables**
   - `IK_LLAMA_CPP_*` variables

### Upstream Features (Not in ik_llama.cpp)

1. **Native gpt-oss Support**
   - MXFP4 format support

2. **Enhanced Speculative Decoding**
   - More draft model options

3. **Updated Model Support**
   - Latest model architectures

4. **Improved Tool Calling**
   - Enhanced function calling

5. **WebGPU Support**
   - Browser-based inference (in progress)

### Version Differences

| Feature | Upstream | ik_llama.cpp |
|---------|----------|--------------|
| IQK Quants | ❌ | ✅ |
| Trellis Quants | ❌ | ✅ |
| FlashMLA | ❌ | ✅ |
| Graph Split | ❌ | ✅ |
| gpt-oss | ✅ | ❌ |
| Latest Models | ✅ | ⚠️ |

## References

- [llama.cpp GitHub](https://github.com/ggml-org/llama.cpp)
- [llama.cpp Documentation](https://github.com/ggml-org/llama.cpp/tree/master/docs)
- [llama.cpp Wiki](https://github.com/ggml-org/llama.cpp/wiki)
- [Build Documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)
- [Server Parameters](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [CLI Parameters](https://github.com/ggml-org/llama.cpp/blob/master/tools/cli/README.md)

## Contributing

To contribute to llama.cpp:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation

## License

llama.cpp is licensed under the MIT License. See [LICENSE](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE) for details.
