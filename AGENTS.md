# AGENTS.md - Instructions for AI Agents

> This file outlines standards and procedures for AI agents working in this repository. It is intended for use by AI coding assistants to ensure consistent, high-quality contributions.

---

## Build, Lint, and Test Commands

### Build Commands
```bash
# CPU build (default)
cmake -B build
cmake --build build --config Release

# CUDA build
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release

# Debug build
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build

# Build server only
cmake --build build --target llama-server
```

### Test Commands
```bash
# Run a single test
./tools/server/tests/tests.sh unit/test_chat_completion.py::test_invalid_chat_completion_req

# Run all tests in a file
./tools/server/tests/tests.sh unit/test_chat_completion.py -v -x

# Run pre-commit hooks
pre-commit run --all-files
```

### Linting
```bash
# Run flake8
flake8

# Run mypy
mypy

# Run clang-format check
clang-format -output-replacements-xml | xmlstarlet sel //error
```

---

## Code Style Guidelines

### General Formatting
- Use 4-space indentation
- Enforce LF line endings
- Trim trailing whitespace
- Include final newline

### Import Order (C++)
1. Double-quoted headers (`"header.h"`)
2. Standard C headers (`<stdio.h>`)
3. Standard C++ headers (`<vector>`, `<string>`, etc.)
4. Third-party headers

### Import Order (Python)
- Standard library imports
- Related third-party imports
- Local application imports

### Naming Conventions
- Functions, variables, types: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Prefixes for enums and structs: `LLAMA_`, `LLAMA_CTX_`

### Type Usage
- Prefer explicit types over `auto`
- Use `int32_t`, `uint64_t` for public APIs
- Omit `struct`/`enum` keywords in C++ when possible
- Use opaque types with `_t` suffix

### Error Handling
- Return error codes for all error conditions
- Use `llama_log` for structured logging
- Clean up allocated resources in every code path
- Handle allocation failures gracefully

### Preprocessor Directives
```cpp
#ifdef MACRO
#endif // MACRO
```

### File Naming
- Headers: lowercase with dashes (e.g., `llama_model.h`)
- Source files: lowercase with dashes (e.g., `llama_model.cpp`)
- Implementation files: lowercase with dashes (e.g., `llama_model.c`)

---

## AI Agent Usage Policy

### Permitted Activities
- Answering codebase questions
- Reviewing existing code
- Suggesting refactorings
- Writing missing tests
- Drafting documentation

### Forbidden Activities
- Submitting AI-generated pull requests
- Making autonomous commit decisions
- Bypassing human review
- Generating entire modules without supervision

### Required Practices
- Disclose AI assistance in commits
- Manually verify all generated code
- Explain any AI-generated logic before committing
- Never commit secrets or API keys

---

## Related Directories
- `docs/` - Documentation source
- `tools/server/` - Server-related scripts
- `llama.cpp/` - Core model implementation
- `tests/` - Test suite

---

## Cursor and Copilot Rules

### Cursor Rules
If a `.cursor/rules/` directory exists, follow each `.md` file as a priority instruction.

### Copilot Rules
If a `.github/copilot-instructions.md` file exists, respect its guidelines for code suggestions and commit messages.