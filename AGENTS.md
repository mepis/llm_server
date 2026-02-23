# AGENTS.md - LLM Server Project Directives

This file contains instructions and directives for AI coding agents working on this project.

## Project Overview

This is a local LLM management system built with Node.js (Express.js) backend and Vue.js frontend. The system manages llama.cpp installation, configuration, and operation with a web interface for model management, system monitoring, and service control.

## Technology Stack

- **Backend:** Node.js, Express.js, SQLite
- **Frontend:** Vue.js 3, Vite
- **System Services:** systemd (Ubuntu 24)
- **Target Platform:** Ubuntu 24, self-hosted
- **Configuration:** .env file + SQLite database

## Project Configuration

- **Creative Liberty Level:** 5/10 (moderate autonomy, ask for clarification on ambiguous requirements)
- **Frontend Port:** 3000
- **Llama-server Port:** 8080
- **Model Storage:** `./models/`
- **Llama.cpp Location:** `./llama.cpp/`
- **Auto-update Check Frequency:** 5 minutes

## Core Directives

### Development Standards

1. **Minimal Dependencies:** Use as few external dependencies as possible. Only use external libraries when no reasonable native alternative exists.

2. **Code Quality:**
   - Write clean, readable, well-commented code
   - Follow Node.js best practices
   - Use async/await for asynchronous operations
   - Implement proper error handling
   - No hardcoded values - use config files or environment variables

3. **Git Workflow:**
   - Create a commit after each feature is completed or bug is fixed
   - Push commits after committing
   - Use descriptive commit messages following the format:
     ```
     <type>: <summary>

     <detailed description>

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Testing Requirements:**
   - Create unit tests for all new functions
   - Update existing unit tests when modifying functions
   - Maintain minimum 70% code coverage
   - Create integration tests for critical workflows
   - Run tests before committing

5. **Documentation Requirements:**
   - Document all APIs, functions, and configuration options
   - Update documentation when making changes
   - Keep documentation in individual markdown files in `docs/`
   - Update `docs/index.md` when adding new documentation
   - Integrate documentation into frontend

### Change Logging

After every commit:
1. Create a new change log file in `logs/change_logs/` with date in filename
2. Include merge request title and summary
3. Update `logs/change_logs/changelog_index.md` with link to new changelog

### Progress Logging

1. Log all progress in `logs/progress/` folder
2. Update `logs/progress_index.md` with links and summaries
3. Use descriptive summaries that help LLMs and humans locate specific information

### Security Guidelines

1. Never commit secrets or sensitive data to git
2. Use .env for configuration (excluded from git)
3. Validate all user inputs
4. Sanitize shell command arguments to prevent injection
5. Check file permissions before operations
6. Use prepared statements for SQL queries

### Feature Development

When adding new features:
1. Review development plan in `logs/development_plan.md`
2. Update plan if feature doesn't fit existing phases
3. Create or update unit tests
4. Update documentation
5. Test feature thoroughly
6. Create git commit
7. Create change log
8. Update progress log

### Bug Fixing

When fixing bugs:
1. Identify root cause
2. Create test case that reproduces bug
3. Fix the bug
4. Verify test case passes
5. Check for similar issues elsewhere
6. Update documentation if needed
7. Create git commit
8. Create change log

### Code Review Checklist

Before committing code, verify:
- [ ] Code follows project standards
- [ ] No hardcoded values (use config)
- [ ] Proper error handling implemented
- [ ] Unit tests created/updated
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.log in production code
- [ ] No commented-out code
- [ ] No TODO comments without issue tracking

### Shell Script Standards

1. Use bash for scripts
2. Include shebang: `#!/bin/bash`
3. Use `set -e` to exit on error
4. Validate inputs and prerequisites
5. Provide informative error messages
6. Log operations for troubleshooting
7. Make scripts idempotent where possible

### API Development Standards

1. Use RESTful conventions
2. Return consistent JSON response format:
   ```json
   {
     "success": true/false,
     "data": {...},
     "error": "error message if applicable"
   }
   ```
3. Use appropriate HTTP status codes
4. Implement request validation
5. Log API errors
6. Document all endpoints

### Frontend Development Standards

1. Use Vue 3 Composition API
2. Follow mint and white theme
3. Make components reusable
4. Implement loading states
5. Show user-friendly error messages
6. Optimize for performance
7. Make responsive (mobile-friendly)
8. Use semantic HTML

### Database Standards

1. Use SQLite for all data storage
2. Create migrations for schema changes
3. Use prepared statements (prevent SQL injection)
4. Index frequently queried columns
5. Document schema in code comments
6. Back up database before migrations

## Project-Specific Guidelines

### Hardware Detection

- Always detect hardware before building llama.cpp
- Support CPU-only, NVIDIA GPU (CUDA), and AMD GPU (ROCm)
- Provide clear feedback about detected hardware
- Gracefully handle detection failures

### Llama.cpp Build Process

- Clone to `./llama.cpp/` directory
- Select build type based on hardware detection
- For NVIDIA GPUs: use CUDA, enable unified memory
- Log build output for troubleshooting
- Store build history in database
- Verify build success before proceeding

### Service Management

- Use systemd for all services
- Run llama-server as root user
- Run frontend as root user
- Implement graceful start/stop/restart
- Monitor service status
- Provide clear error messages

### Model Management

- Store models in `./models/` directory
- Use HuggingFace API for search
- Track download progress
- Verify file integrity after download
- Store metadata in database
- Allow model deletion with confirmation

### System Monitoring

- Update metrics every 5 seconds (configurable)
- Show CPU, memory, disk, GPU usage
- Display in user-friendly format (gauges/charts)
- Handle missing GPU gracefully
- Log metric errors

## Testing Strategy

### Unit Tests

- Test all utility functions
- Test database operations
- Test API endpoints
- Mock external dependencies
- Use Jest or Mocha

### Integration Tests

- Test complete workflows
- Test hardware detection → build → service start
- Test model search → download → use
- Test auto-update process

### QA Testing

- Test on fresh Ubuntu 24 installation
- Test with and without GPU
- Test all user interactions
- Verify service persistence across reboots
- Test error scenarios
- Check for security vulnerabilities

## Maintenance Directives

### When User Reports Bug

1. Reproduce the issue
2. Check logs for errors
3. Create test case
4. Fix bug
5. Verify fix
6. Update tests
7. Commit and log

### When User Requests Feature

1. Clarify requirements (creative liberty = 5/10)
2. Check if it fits existing plan
3. Update plan if needed
4. Implement feature following standards
5. Test thoroughly
6. Document
7. Commit and log

### When Updating Dependencies

1. Review changelog for breaking changes
2. Update code for compatibility
3. Run all tests
4. Update documentation
5. Commit with detailed notes

## File Structure Reference

```
llm_server/
├── AGENTS.md                 # This file
├── .env                      # Environment config (not in git)
├── .gitignore
├── package.json
├── server/                   # Backend
│   ├── index.js              # Express server entry
│   ├── routes/               # API routes
│   ├── controllers/          # Business logic
│   ├── models/               # Database models
│   ├── services/             # Service layer
│   └── utils/                # Utilities
├── web/                      # Frontend (Vue.js)
│   ├── src/
│   ├── public/
│   └── dist/                 # Build output
├── scripts/                  # Shell scripts
│   ├── install/
│   ├── llama/
│   ├── service/
│   └── update/
├── models/                   # Downloaded LLM models
├── llama.cpp/                # Llama.cpp repository (cloned)
├── logs/                     # All logs
│   ├── development_plan.md
│   ├── progress/
│   │   └── progress_index.md
│   └── change_logs/
│       └── changelog_index.md
├── docs/                     # Documentation
│   └── index.md
└── tests/                    # Unit and integration tests
```

## Important Reminders

1. **Never skip testing** - Tests prevent regressions
2. **Always update documentation** - Future developers will thank you
3. **Security first** - Validate inputs, sanitize commands, check permissions
4. **User experience matters** - Provide clear feedback and error messages
5. **Keep it simple** - Avoid over-engineering
6. **Log everything important** - Helps with troubleshooting
7. **Follow the plan** - Refer to `logs/development_plan.md`

## Contact and Resources

- Development Plan: `logs/development_plan.md`
- Progress Logs: `logs/progress/`
- Change Logs: `logs/change_logs/`
- Documentation: `docs/`
- Llama.cpp Docs: https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md

---

**Last Updated:** 2026-02-22
**Version:** 1.0.0
