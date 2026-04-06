# Deployment Guide

This document covers the deployment of LLM Server to production environments, including Docker configurations, environment setup, and best practices.

---

## Overview

This guide provides step-by-step instructions for deploying LLM Server in various environments, from local development to production.

### Deployment Options

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Options                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Local       │  Development on localhost                     │
│  │  Development │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Docker      │  Containerized deployment                     │
│  │  Desktop     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Docker      │  Production containers                        │
│  │  Compose     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Cloud       │  AWS, GCP, Azure                              │
│  │  Hosting     │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Kubernetes  │  Orchestration                                │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites

- Node.js >= 24.12
- MongoDB >= 8.2
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd llm_server

# Install backend dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start MongoDB (if not running)
mongod --dbpath /path/to/data/db

# Start backend server
npm run dev
```

### Run All Services

```bash
# Start all services including frontend and tests
./run_all.sh
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:24.12-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - MONGODB_URI=mongodb://mongodb:27017/llm_server
      - JWT_SECRET=your-secret-key
      - LLAMA_SERVER_URL=http://llama:8082
    depends_on:
      - mongodb
      - llama
    volumes:
      - logs:/app/logs

  mongodb:
    image: mongo:8.2
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=llm_server

  llama:
    image: llama.cpp:latest
    ports:
      - "8082:8082"
    volumes:
      - ./models:/models
    environment:
      - PORT=8082
      - MODEL=/models/llama-3-8b.gguf

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app

volumes:
  mongodb_data:
  logs:
```

### Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Production Deployment

### Environment-Specific Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Configuration                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  .env.prod   │  Production environment variables            │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  .env.devel  │  Development environment variables           │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  .env.test   │  Test environment variables                  │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Production Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://mongo-cluster:27017/llm_server?replicaSet=rs0
MONGODB_OPTIONS=socketTimeoutMS=30000,connectTimeoutMS=10000

# Authentication
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=7d

# Llama.cpp
LLAMA_SERVER_URL=https://llama-server.internal:8082
LLAMA_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Security
SESSION_TIMEOUT=86400000
MAX_FILE_SIZE=10485760
```

---

## Security Best Practices

### Secrets Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    Secrets Management                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  .env       │  Never commit to version control              │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  .gitignore │  Add .env to gitignore                        │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Environment│  Use environment variables                    │
│  │  Variables  │  at runtime                                   │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Secrets    │  Use secrets manager (AWS Secrets Manager)   │
│  │  Manager     │  for production                              │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Checklist

- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Enable database authentication
- [ ] Set up backup strategy
- [ ] Configure log aggregation
- [ ] Set up monitoring and alerting

---

## Monitoring Setup

### Health Check Endpoint

```
GET /api/monitor/health
```

### Log Aggregation

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Setup                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Winston     │  Application logging                          │
│  │  Logger      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  MongoDB     │  Database operations                          │
│  │  Logs        │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Log         │  Centralized log aggregation                  │
│  │  Aggregator  │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Monitoring  │  Alerts and dashboards                        │
│  │  Dashboard   │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tags

- `deployment` - Deployment guide
- `docker` - Docker configuration
- `production` - Production deployment

---

## Related Documentation

- [Configuration Guide](./configuration-guide.md) - Environment variables
- [Performance Guide](./performance-guide.md) - Optimization
- [Troubleshooting](./troubleshooting.md) - Common issues
