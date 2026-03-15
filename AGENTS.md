# AGENTS.md - Instructions for AI Agents

> This file outlines standards and procedures for AI agents working in this repository. It is intended for use by AI coding assistants to ensure consistent, high‑quality contributions.

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

# Clean build artifacts
cmake --build build --target clean
```

### Test Commands
```bash
# Run a single test (specify file and test name)
./tools/server/tests/tests.sh unit/test_chat_completion.py::test_invalid_chat_completion_req

# Run all tests in a file with verbose output, stop on first failure
./tools/server/tests/tests.sh unit/test_chat_completion.py -v -x

# Run a subset of tests using a grep pattern
./tools/server/tests/tests.sh unit/*.py -k "test_.*_edge"

# Run pre‑commit hooks manually
pre-commit run --all-files
```

### Linting & Static Analysis
```bash
# Python style checks
flake8

# Type checking
mypy

# C++ static analysis
clang-tidy -p build src/**/*.cpp

# Formatting compliance
clang-format -output-replacements-xml | xmlstarlet sel //error
```

---
## Code Style Guidelines

### General Formatting
- 4‑space indentation; tabs prohibited.
- LF line endings only; no CRLF.
- Trim trailing whitespace.
- Include final newline.
- Keep lines ≤120 characters when possible.
- Use descriptive variable names.

### Import Order (C++)
1. Double‑quoted headers (`"header.h"`)
2. Standard C headers (`<stdio.h>`, `<stdlib.h>`, …)
3. Standard C++ headers (`<vector>`, `<string>`, `<unordered_map>`, …)
4. Third‑party headers (e.g., `"llama.h"`)
5. Project‑specific headers

### Import Order (Python)
- Standard library
- Third‑party packages
- Local application imports

### Naming Conventions
- Functions, variables, type aliases: `snake_case`
- Classes, structs: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums/struct tags: prefix with `LLAMA_` or `LLAMA_CTX_`
- Private members: prepend `_`
- Prefix public functions with module name for clarity.
- Use versioned constants for feature flags.

### Type Usage
- Prefer explicit types over `auto` in public APIs.
- Use fixed‑width integers (`int32_t`, `uint64_t`) for cross‑platform code.
- Omit `struct`/`enum` keywords in function signatures when type is clear.
- Use opaque types ending in `_t` for public handles.

### Error Handling
- Return error codes for all failures; never abort silently.
- Use `llama_log` with appropriate severity levels.
- Clean up all allocated resources on every exit path.
- Check return values of `malloc`/`calloc`/`new`.
- Convert internal errors to user‑friendly messages for public APIs.
- Validate all inputs before processing.
- Use assertions for internal invariants.
- Log error details with context and timestamps.
- Prefer early returns for error paths.
- Document error semantics in public APIs.

---
## AI Agent Usage Policy

### Permitted Activities
- Answer codebase questions.
- Review existing code.
- Suggest refactorings.
- Write missing tests.
- Draft documentation.
- Update `README.md` with examples.

### Forbidden Activities
- Submit AI‑generated PRs without manual review.
- Make autonomous commit decisions.
- Bypass pre‑commit hooks or CI.
- Generate entire modules without supervision.
- Hard‑code secrets, API keys, or credentials.

### Required Practices
- Disclose AI assistance in commit messages (`AI: generated X`).
- Manually verify all generated code for correctness and security.
- Explain AI‑generated logic before committing.
- Never commit secrets.
- Run `pre-commit run --all-files` and ensure all checks pass before pushing.

## Related Directories
- `docs/` – Documentation source.
- `tools/server/` – Server‑related scripts and utilities.
- `llama.cpp/` – Core model implementation.
- `tests/` – Test suite.
- `scripts/` – Automation and deployment scripts.
- `ci/` – CI configuration files.

---
*Document generated on Sun Mar 15 2026.*