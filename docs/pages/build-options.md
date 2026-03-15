---
title: Build Options
---
# Build Options

llama.cpp is configured using CMake. The following options control the build process and the features that are compiled in.

## CMake Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `LLAMA_USE_SYSTEM_GGML` | `OFF` | Use a system‑installed `libggml` instead of bundling it. |
| `LLAMA_WASM_MEM64` | `ON` | Enable 64‑bit memory for WebAssembly builds. |
| `LLAMA_WASM_SINGLE_FILE` | `OFF` | Embed the WASM binary inside a single HTML file. |
| `LLAMA_BUILD_HTML` | `ON` | Build the HTML demo page. |
| `BUILD_SHARED_LIBS` | Depends on `LLAMA_STANDALONE` | Build shared libraries instead of static libraries. |
| `LLAMA_ALL_WARNINGS` | `ON` | Enable all compiler warnings. |
| `LLAMA_ALL_WARNINGS_3RD_PARTY` | `OFF` | Enable all compiler warnings for third‑party code. |
| `LLAMA_FATAL_WARNINGS` | `OFF` | Treat warnings as errors (`-Werror`). |
| `LLAMA_SANITIZE_THREAD` | `OFF` | Enable ThreadSanitizer. |
| `LLAMA_SANITIZE_ADDRESS` | `OFF` | Enable AddressSanitizer. |
| `LLAMA_SANITIZE_UNDEFINED` | `OFF` | Enable UndefinedBehaviorSanitizer. |
| `LLAMA_BUILD_COMMON` | `ON` (if `LLAMA_STANDALONE`) | Build the common utilities library. |
| `LLAMA_BUILD_TESTS` | `ON` (if `LLAMA_STANDALONE`) | Build unit tests. |
| `LLAMA_BUILD_TOOLS` | `ON` (if `LLAMA_STANDALONE`) | Build command‑line tools (e.g., `llama-cli`). |
| `LLAMA_BUILD_EXAMPLES` | `ON` (if `LLAMA_STANDALONE`) | Build example applications. |
| `LLAMA_BUILD_SERVER` | `ON` (if `LLAMA_STANDALONE`) | Build the server example. |
| `LLAMA_TOOLS_INSTALL` | `ON` (if `LLAMA_STANDALONE`) | Install command‑line tools during `make install`. |
| `LLAMA_TESTS_INSTALL` | `ON` | Install unit tests during `make install`. |
| `LLAMA_OPENSSL` | `ON` | Enable OpenSSL support for HTTPS in server mode. |
| `LLAMA_LLGUIDANCE` | `OFF` | Include LLGuidance library for structured output in common utils. |
| `GGML_CUDA_GRAPHS` | `ON` | Enable CUDA Graphs for improved GPU performance. |
| `GGML_METAL` | `OFF` | Enable Metal backend for macOS. |
| `GGML_SYCL` | `OFF` | Enable SYCL backend for oneAPI. |
| `GGML_NATIVE` | `ON` | Enable native CPU instruction set optimizations. |
| `GGML_CUDA` | `OFF` | Enable CUDA support. |
| `GGML_SYCL` | `OFF` | Enable SYCL support (alternative to CUDA). |
| `GGML_METAL` | `OFF` | Enable Metal (Apple GPU) support. |
| `GGML_RPC` | `OFF` | Enable RPC (remote procedure call) support. |
| `GGML_NATIVE` | `ON` | Enable native CPU instruction set optimizations. |
| `LLAMA_WASM_MEM64` | `ON` | Use 64‑bit memory addressing in WebAssembly. |
| `LLAMA_WASM_SINGLE_FILE` | `OFF` | Generate a single HTML file that includes the WASM binary. |
| `LLAMA_BUILD_HTML` | `ON` | Build the HTML demo page. |

## Build‑related Targets

- `make` or `cmake --build .` – builds all targets.
- `make <target>` – builds a specific target (e.g., `make llama-cli`, `make server`).
- `make install` – installs binaries and libraries to the prefix directory.
- `make test` – runs unit tests (if built with `LLAMA_BUILD_TESTS=ON`).

> **Note**: Many of these options are deprecated or replaced by newer flags; the table reflects the current canonical list.