# AGENTS.md - Instructions for llm_server (llama.cpp)

> [!IMPORTANT]
> This project does **not** accept pull requests that are fully or predominantly AI-generated. AI tools may be utilized solely in an assistive capacity.
> Read more: [CONTRIBUTING.md](llama.cpp/CONTRIBUTING.md)

---

## Build & Test Commands

### Build Commands
```bash
# CPU build (default)
cmake -B build
cmake --build build --config Release

# With CUDA support
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release

# Build server only
cmake --build build --target llama-server

# Debug build
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```

### Test Commands
```bash
# Run full CI locally (heavy-duty)
mkdir tmp
bash ./ci/run.sh ./tmp/results ./tmp/mnt

# Run server tests (Python/pytest)
cd tools/server/tests
pip install -r requirements.txt
./tests.sh

# Run a single server test
./tests.sh unit/test_chat_completion.py::test_invalid_chat_completion_req

# Run all tests in a file
./tests.sh unit/test_chat_completion.py -v -x

# Run Python linters
flake8
mypy

# Run pre-commit hooks
pre-commit run --all-files
```

### Server WebUI Development
```bash
cd tools/server/webui
npm i
npm run dev      # Dev server with hot reload
npm run test     # Run tests
npm run build    # Build production bundle
```

---

## Code Style Guidelines

### General
- Use `clang-format` (clang-tools v15+) for C++ code formatting
- Use 4-space indentation for C/C++ and Python
- Use trailing whitespace cleanup
- Ensure final newline at EOF
- Use LF line endings

### C/C++ Coding Style
- **Naming**: Use `snake_case` for functions, variables, and types
- **Prefixing**: Optimize for longest common prefix (e.g., `number_small`, `number_big`)
- **Enums**: Upper case with enum prefix (e.g., `LLAMA_VOCAB_TYPE_SPM`)
- **Functions**: Use `<class>_<method>` pattern (e.g., `llama_model_init()`, `llama_sampler_chain_remove()`)
- **Types**: Omit `struct`/`enum` keywords in C++ when not necessary
- **Opaque types**: Use `_t` suffix (e.g., `llama_context_t`)
- **File naming**: Lowercase with dashes for headers/headers (`.h`), source files (`.c`, `.cpp`)
- **Integer types**: Use sized types like `int32_t` in public API
- **Avoid**: Fancy modern STL, excessive templates, use basic for-loops
- **Matrix order**: Row-major; dimension 0 = columns, 1 = rows, 2 = matrices
- **Matmul convention**: `C = ggml_mul_mat(ctx, A, B)` means $C^T = A B^T \Leftrightarrow C = B A^T$

### Python Coding Style
- **File naming**: Lowercase with underscores
- **Line length**: Max 125 characters
- **Type hints**: Use mypy with `strict = true` (allow_untyped_calls/defs/defs)
- **Linter**: Use flake8 with configuration in `.flake8`
- **Exclude**: examples/, tools/, __init__.py, build/, dist/, .git/, __pycache__

### Import Order (C++)
1. Double-quoted headers (`"header.h")
2. Standard C headers (`<stdio.h>`)
3. Standard C++ headers (`<vector>`)
4. Third-party headers

### Error Handling
- Return error codes where appropriate
- Use `llama_log` for logging
- Clean up resources in destructors
- Handle memory allocation failures gracefully

### Preprocessor Directives
```cpp
#ifdef FOO
#endif // FOO
```

---

## AI Usage Policy

### Permitted Usage
- Ask about codebase structure
- Learning about techniques
- Code review and improvement suggestions
- Formatting for consistency
- Completing code based on patterns
- Drafting documentation

### Forbidden Usage
- Writing code for contributors
- Generating entire PRs or large code blocks
- Bypassing human understanding
- Making decisions on behalf of contributors
- Submitting work the contributor cannot explain

### Required Disclosure
When AI is used to generate any portion of code:
1. Explicitly disclose AI usage
2. Perform comprehensive manual review
3. Be prepared to explain every line
4. Never use AI to write posts (bug reports, PR descriptions, responses)

---

## Related Documentation
- [CONTRIBUTING.md](llama.cpp/CONTRIBUTING.md) - Contributor guidelines
- [docs/build.md](llama.cpp/docs/build.md) - Build documentation
- [tools/server/README-dev.md](llama.cpp/tools/server/README-dev.md) - Server development
- [tools/server/tests/README.md](llama.cpp/tools/server/tests/README.md) - Server testing