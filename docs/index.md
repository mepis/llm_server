# LLM Server Documentation

Welcome to the LLM Server documentation. This system provides a comprehensive web-based interface for managing local LLM deployments using llama.cpp.

## Quick Links

### Getting Started
- [Installation Guide](installation.md) - Complete installation instructions
- [Quick Start Guide](quickstart.md) - Get up and running quickly
- [Configuration](configuration.md) - Configure the system for your needs

### User Guides
- [Model Management](model-management.md) - Download and manage models from HuggingFace
- [System Monitoring](system-monitoring.md) - Monitor system resources and performance
- [Service Management](service-management.md) - Control llama-server and frontend services

### Developer Documentation
- [API Reference](api-reference.md) - Complete API documentation
- [Architecture](architecture.md) - System architecture overview
- [Database Schema](database-schema.md) - SQLite database structure
- [Contributing](contributing.md) - Guidelines for contributors

### Advanced Topics
- [Hardware Optimization](hardware-optimization.md) - Optimize for your hardware (CPU/GPU)
- [Building Llama.cpp](building-llamacpp.md) - Custom llama.cpp builds
- [Service Configuration](service-configuration.md) - Advanced service setup
- [Auto-Update System](auto-update.md) - Repository monitoring and updates

### Troubleshooting
- [FAQ](faq.md) - Frequently asked questions
- [Troubleshooting Guide](troubleshooting.md) - Common issues and solutions
- [Error Messages](error-messages.md) - Error message reference

### Reference
- [Scripts Reference](scripts-reference.md) - Available shell scripts
- [Environment Variables](environment-variables.md) - Configuration via .env
- [System Requirements](system-requirements.md) - Hardware and software requirements

## Project Information

- **Version:** 1.0.0 (In Development)
- **License:** TBD
- **Repository:** Local development
- **Target Platform:** Ubuntu 24
- **Backend:** Node.js + Express.js + SQLite
- **Frontend:** Vue.js 3

## About This System

LLM Server is a self-hosted management system for running large language models locally using llama.cpp. It provides:

- Automated hardware detection and optimization
- One-click llama.cpp installation and building
- HuggingFace model search and download
- Real-time system monitoring
- Service management via systemd
- Automatic repository updates
- Web-based interface accessible over your network

## Support

For issues, questions, or contributions, please refer to the [Troubleshooting Guide](troubleshooting.md) or check the project repository.

---

**Note:** This documentation is continuously updated as the project develops. Some features may not yet be implemented.

**Last Updated:** 2026-02-22
