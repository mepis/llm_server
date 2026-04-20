# Implementation Todo

Overview: This document tracks high-level implementation tasks for the LLM Server project. It is a lightweight, repository-scoped plan to guide development and auditing.

- [ ] Establish secure env handling (ensure .env is ignored; provide .env.example).
- [ ] Validate and fix documentation links (docs/index.md references design_documents/todo.md; ensure correct paths).
- [ ] Review AGENTS.md for any outdated operational instructions and align with current codebase.
- [ ] Reconcile documentation with CHANGELOG updates workflow (ensure commit messages reflect why).
- [ ] Add or align a stable Todo workflow in the repo (consider centralizing in docs or a top-level DESIGN doc).
- [ ] Audit repository for any secrets leakage (remove from history if present) and implement secret scanning pre-commit gate.
- [ ] Ensure .gitignore covers environment files (.env) and any secret artifacts.
- [ ] Validate that documentation pages exist for all major features (authentication, chat, LLM integration, tool support, matrix, etc.).
- [ ] Create a short CHANGELOG-focused template for quick releases.

Priority legend: high, medium, low (per task impact).

Owner: open for assignment.
