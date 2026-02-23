# LLM Server

A comprehensive local LLM management system with automated llama.cpp installation and a Vue.js web interface.

## Features

- Automated hardware detection and optimization (CPU/NVIDIA GPU/AMD GPU)
- One-click llama.cpp installation and building
- HuggingFace model search and download
- Real-time system monitoring (CPU, RAM, GPU usage)
- Systemd service management
- Automatic repository updates
- Web-based interface accessible over your network
- SQLite-based configuration storage

## Technology Stack

- **Backend:** Node.js, Express.js, SQLite
- **Frontend:** Vue.js 3, Vite
- **System Services:** systemd
- **Target Platform:** Ubuntu 24
- **Hosting:** Self-hosted

## Quick Start

*Installation instructions coming soon*

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Initialize database
npm run db:init

# Start development server
npm run dev

# Start frontend development
npm run dev:frontend
```

## Documentation

Full documentation is available in the [docs/](docs/) folder or through the web interface once installed.

- [Installation Guide](docs/installation.md)
- [Configuration](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

## Project Structure

```
llm_server/
├── server/           # Backend (Node.js/Express)
├── web/              # Frontend (Vue.js)
├── scripts/          # Shell scripts
├── models/           # Downloaded LLM models
├── docs/             # Documentation
├── logs/             # Progress and change logs
└── tests/            # Unit and integration tests
```

## Requirements

- Ubuntu 24 (or compatible Linux distribution)
- Node.js 18+
- 8GB+ RAM (16GB+ recommended)
- Optional: NVIDIA GPU with CUDA support for acceleration

## License

ISC

## Contributing

See [AGENTS.md](AGENTS.md) for development guidelines and directives.

---

**Status:** In Development
**Version:** 1.0.0
