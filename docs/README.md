# LLM Server Documentation

Welcome to the LLM Server documentation. This repository contains comprehensive guides for building and running LLM servers using llama.cpp and ik_llama.cpp.

## Table of Contents

### Getting Started

- [Quick Start](#quick-start)
- [Installation](#installation)
- [First Inference](#first-inference)

### Build & Configuration

- [Build System](build.md)
- [llama.cpp Flags](llama_cpp_flags.md)
  - Build Configuration
  - Runtime Parameters
  - GPU Offload
  - Quantization
  - Tools
  - Environment Variables
- [Model Selection](model_selection.md)

### Usage

- [Running the Server](running.md)
- [API Reference](api.md)
- [Chat Interface](chat.md)
- [Batch Processing](batch.md)

### Advanced Topics

- [Performance Optimization](performance.md)
- [Multi-GPU Setup](multi_gpu.md)
- [Custom Models](custom_models.md)
- [Fine-tuning](finetuning.md)

### Troubleshooting

- [Common Issues](troubleshooting.md)
- [FAQ](faq.md)
- [Debugging](debugging.md)

## Quick Start

### Prerequisites

- Linux, macOS, or Windows
- CUDA-capable GPU (recommended) or modern CPU
- 8GB+ RAM (16GB+ recommended)
- 10GB+ free disk space

### Installation

```bash
# Clone repository
git clone https://github.com/ik-llm/llm_server.git
cd llm_server

# Initialize environment
./scripts/init.sh

# Build with CUDA support
./scripts/build.sh
```

### First Inference

```bash
# Run with default model
./scripts/run.sh

# Or run specific quantization
./scripts/run_qwen3.5-35-q8.sh
```

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [build.md](build.md) | Build system and configuration |
| [llama_cpp_flags.md](llama_cpp_flags.md) | Complete flag reference for llama.cpp |
| [model_selection.md](model_selection.md) | Model selection guide |
| [running.md](running.md) | Running the server |

### API Documentation

| Document | Description |
|----------|-------------|
| [api.md](api.md) | REST API reference |
| [chat.md](chat.md) | Chat interface usage |
| [batch.md](batch.md) | Batch processing |

### Advanced Topics

| Document | Description |
|----------|-------------|
| [performance.md](performance.md) | Performance optimization |
| [multi_gpu.md](multi_gpu.md) | Multi-GPU configuration |
| [custom_models.md](custom_models.md) | Custom model support |
| [finetuning.md](finetuning.md) | Fine-tuning guide |

### Troubleshooting

| Document | Description |
|----------|-------------|
| [troubleshooting.md](troubleshooting.md) | Common issues and solutions |
| [faq.md](faq.md) | Frequently asked questions |
| [debugging.md](debugging.md) | Debugging guide |

## Key Scripts

### Build Scripts

```bash
./scripts/init.sh      # Initialize environment
./scripts/build.sh     # Build llama.cpp
./scripts/benchmark.sh # Run benchmarks
```

### Run Scripts

```bash
./scripts/run.sh              # Default run
./scripts/run_qwen3.5-35-q8.sh     # Q8 quantization
./scripts/run_qwen3.5-35-q6-k-s.sh # Q6_K_S quantization
```

### Management Scripts

```bash
./scripts/kill.sh    # Stop server
./scripts/status.sh  # Check status
```

## Quick References

### Common Commands

```bash
# Build with specific GPU backend
./scripts/build.sh --cuda

# Run with custom model
./scripts/run.sh --model path/to/model.gguf

# Run benchmarks
./scripts/benchmark.sh

# Check logs
tail -f ~/.llm_server/logs/server.log
```

### Environment Variables

```bash
export GGML_CUDA=ON              # Enable CUDA
export LLAMA_CACHE=~/.llm_cache  # Set cache directory
export OMP_NUM_THREADS=8         # Set thread count
```

### API Endpoints

```bash
# Chat completion
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen3.5", "messages": [{"role": "user", "content": "Hello"}]}'

# Model info
curl http://localhost:11434/api/models

# Stop server
curl -X POST http://localhost:11434/api/stop
```

## Support

- **Documentation**: This folder
- **Issues**: GitHub Issues
- **Community**: Discord/Slack channels
- **Email**: support@example.com

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](../CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
