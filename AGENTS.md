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
# Run a single test (specify full path to test file and test name)
./tools/server/tests/tests.sh unit/test_chat_completion.py::test_invalid_chat_completion_req

# Run all tests in a file with verbose output and stop on first failure
./tools/server/tests/tests.sh unit/test_chat_completion.py -v -x

# Run a subset of tests using grep pattern (example)
./tools/server/tests/tests.sh unit/*.py -k "test_.*_edge"

# Run pre‑commit hooks manually
pre-commit run --all-files

# Run linting checks only
flake8
mypy
clang-format -output-replacements-xml | xmlstarlet sel //error
```

### Linting & Static Analysis
```bash
# Run flake8 for Python style checks
flake8

# Run mypy for type checking
mypy

# Run clang‑tidy for C++ static analysis
clang-tidy -p build src/**/*.cpp

# Run clang-format check for formatting compliance
clang-format -output-replacements-xml | xmlstarlet sel //error
```

---

## Code Style Guidelines

### General Formatting
- Use 4‑space indentation; tabs are prohibited.
- Enforce LF line endings; avoid CRLF.
- Trim trailing whitespace on all lines.
- Include a final newline at the end of each file.
- Keep lines under 120 characters when possible; wrap longer lines.

### Import Order (C++)
1. Double‑quoted headers (`"header.h"`)
2. Standard C headers (`<stdio.h>`, `<stdlib.h>`, etc.)
3. Standard C++ headers (`<vector>`, `<string>`, `<unordered_map>`, etc.)
4. Third‑party libraries (e.g., `"llama.h"`)
5. Project‑specific headers

### Import Order (Python)
- Standard library imports
- Related third‑party imports
- Local application imports

### Naming Conventions
- Functions, variables, and type aliases: `snake_case`
- Classes and structs: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Enums and struct tags: prefix with `LLAMA_` or `LLAMA_CTX_`
- Private members: prepend with underscore (`_member`)

### Type Usage
- Prefer explicit types over `auto` in public APIs.
- Use fixed‑width integer types (`int32_t`, `uint64_t`) for cross‑platform code.
- Omit `struct`/`enum` keywords in function signatures when the type is clear.
- Use opaque types ending in `_t` for public handles.

### Error Handling
- Return error codes for all failure conditions; never abort silently.
- Use `llama_log` with appropriate severity levels for structured logging.
- Clean up allocated resources (memory, file handles, sockets) on every code path, including error exits.
- Handle allocation failures gracefully; check return values of `malloc`/`calloc`/`new`.
- Convert internal errors to user‑friendly messages when exposing APIs.

### Preprocessor Directives
```cpp
#ifdef MACRO
    // code
#endif // MACRO
```
- Keep `#ifdef` blocks small and well‑commented.
- Close directives with explicit comment containing the macro name.

### File Naming
- Headers: lowercase, dash‑separated (e.g., `llama_model.h`)
- Source files: lowercase, dash‑separated (e.g., `llama_model.cpp`)
- Implementation files: lowercase, dash‑separated (e.g., `llama_model.c`)
- Test files: prefix with `test_` and match the unit they verify (e.g., `test_chat_completion.py`)

### Dependency Management
- Pin third‑party versions in `requirements.txt` or `Cargo.lock` as appropriate.
- Run `pip list --outdated` or `cargo outdated` periodically to detect upgrades.
- Avoid committing generated lock files; instead, update them via CI pipeline.

### Environment Variables
- Store configuration in `.env` files; never hard‑code secrets.
- Prefix custom env vars with `LLAMA_` or `APP_` to avoid collisions.
- Document required variables in `README.md` under a “Configuration” section.

### Logging Standards
- Use `llama_log` macro with levels: `INFO`, `DEBUG`, `WARN`, `ERROR`, `FATAL`.
- Include timestamps and context (e.g., module name) in log messages.
- Do not log secrets or personally identifiable information (PII).

### Code Review Checklist
- [ ] Does the change follow the import order rules?
- [ ] Are naming conventions respected?
- [ ] Are error paths cleaned up correctly?
- [ ] Is the change covered by unit tests?
- [ ] Does `git diff` show only intended modifications?
- [ ] Are linting checks passing (`flake8`, `mypy`, `clang-format`)?
- [ ] Is the change documented in `README.md` or relevant docs?

---

## AI Agent Usage Policy

### Permitted Activities
- Answering codebase questions.
- Reviewing existing code.
- Suggesting refactorings.
- Writing missing tests.
- Drafting documentation.
- Updating `README.md` with usage examples.

### Forbidden Activities
- Submitting AI‑generated pull requests without manual review.
- Making autonomous commit decisions that bypass human oversight.
- Bypassing pre‑commit hooks or CI pipelines.
- Generating entire modules without supervision.
- Hard‑coding secrets, API keys, or credentials.

### Required Practices
- Disclose AI assistance in commit messages (`AI: generated X`).
- Manually verify all generated code for correctness and security.
- Explain any AI‑generated logic before committing.
- Never commit secrets or API keys.
- Run `pre-commit run --all-files` and ensure all checks pass before pushing.

---

## Related Directories
- `docs/` – Documentation source.
- `tools/server/` – Server‑related scripts and utilities.
- `llama.cpp/` – Core model implementation.
- `tests/` – Test suite.
- `scripts/` – Automation and deployment scripts.

---

## Cursor and Copilot Rules
- If a `.cursor/rules/` directory exists, treat each `.md` file as a priority instruction set.
- If a `.github/copilot-instructions.md` file exists, respect its guidelines for code suggestions and commit messages.
- When in doubt, default to the most restrictive interpretation to maintain code quality and security.

---

*Document generated on Sun Mar 15 2026.*