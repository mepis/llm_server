# LLM Server - Deployment Guide

**Version:** 1.0.0
**Last Updated:** February 23, 2026

This guide provides comprehensive instructions for deploying the LLM Server in various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Docker Deployment](#docker-deployment)
5. [systemd Service Deployment](#systemd-service-deployment)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- Ubuntu 24.04 LTS (or compatible Linux)
- 2 CPU cores
- 8GB RAM
- 10GB disk space
- Node.js 24.x

**Recommended:**
- Ubuntu 24.04 LTS
- 4+ CPU cores
- 16GB+ RAM
- 50GB+ disk space (for models)
- Node.js 24.x
- NVIDIA GPU with CUDA or AMD GPU with ROCm

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential cmake git

# For CUDA (NVIDIA GPU)
# Follow: https://developer.nvidia.com/cuda-downloads

# For ROCm (AMD GPU)
# Follow: https://rocm.docs.amd.com/
```

---

## Development Deployment

### 1. Clone Repository

```bash
git clone https://github.com/mepis/llm_server.git
cd llm_server
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd web
npm install
cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit `.env`:
```bash
PORT=3000
NODE_ENV=development
DB_PATH=./data/llm_server.db
LLAMA_CPP_DIR=/opt/llama.cpp
PROJECT_ROOT=/path/to/llm_server
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run dev
# Server: http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
# Frontend: http://localhost:5173
```

### 5. Access Application

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- API Docs: http://localhost:3000/api-docs

---

## Production Deployment

### 1. Build Frontend

```bash
cd web
npm run build
cd ..
```

This creates optimized files in `web/dist/`.

### 2. Configure Production Environment

```bash
cp .env.example .env.production
nano .env.production
```

```bash
PORT=3000
NODE_ENV=production
DB_PATH=/var/lib/llm_server/llm_server.db
LLAMA_CPP_DIR=/opt/llama.cpp
PROJECT_ROOT=/opt/llm_server
LOG_LEVEL=info
```

### 3. Create Data Directory

```bash
sudo mkdir -p /var/lib/llm_server
sudo chown $USER:$USER /var/lib/llm_server
```

### 4. Start Production Server

```bash
NODE_ENV=production npm start
```

Server runs on http://localhost:3000 and serves both API and frontend.

---

## Docker Deployment

### 1. Create Dockerfile

File already created at [Dockerfile](Dockerfile).

### 2. Create docker-compose.yml

File already created at [docker-compose.yml](docker-compose.yml).

### 3. Build and Run

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access Application

- Application: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### 5. Persist Data

Volumes are automatically created:
- `llm_server_data`: Database
- `llm_server_models`: Downloaded models
- `llm_server_llama`: llama.cpp builds

---

## systemd Service Deployment

### 1. Edit Service Template

```bash
nano scripts/service/templates/llm-server.service
```

Update paths:
```ini
WorkingDirectory=/opt/llm_server
ExecStart=/usr/bin/node /opt/llm_server/server/index.js
EnvironmentFile=/opt/llm_server/.env.production
```

### 2. Install Service

```bash
sudo bash scripts/service/install-service.sh
```

### 3. Manage Service

```bash
# Start
sudo systemctl start llm-server

# Enable auto-start
sudo systemctl enable llm-server

# Check status
sudo systemctl status llm-server

# View logs
sudo journalctl -u llm-server -f

# Restart
sudo systemctl restart llm-server

# Stop
sudo systemctl stop llm-server
```

---

## Reverse Proxy Setup

### Nginx Configuration

#### 1. Install Nginx

```bash
sudo apt install -y nginx
```

#### 2. Create Site Configuration

```bash
sudo nano /etc/nginx/sites-available/llm-server
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Increase client body size for model uploads
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints with longer timeout
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/llm-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL/TLS Configuration

### Using Certbot (Let's Encrypt)

#### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Obtain Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

#### 3. Auto-renewal

Certbot automatically sets up renewal. Test with:

```bash
sudo certbot renew --dry-run
```

### Manual SSL Configuration

Add to Nginx config:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring and Logging

### Application Logs

**Development:**
```bash
npm run dev
# Logs to console
```

**Production (systemd):**
```bash
# Real-time logs
sudo journalctl -u llm-server -f

# Last 100 lines
sudo journalctl -u llm-server -n 100

# Since specific time
sudo journalctl -u llm-server --since "1 hour ago"

# Export logs
sudo journalctl -u llm-server > llm-server.log
```

### Access Logs (Nginx)

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring Tools

**Install PM2 (Alternative to systemd):**

```bash
npm install -g pm2

# Start
pm2 start server/index.js --name llm-server

# Monitor
pm2 monit

# Logs
pm2 logs llm-server

# Auto-start on boot
pm2 startup
pm2 save
```

---

## Backup and Recovery

### Database Backup

**Manual Backup:**

```bash
# Backup database
cp /var/lib/llm_server/llm_server.db /backup/llm_server_$(date +%Y%m%d).db

# Compress
gzip /backup/llm_server_$(date +%Y%m%d).db
```

**Automated Backup Script:**

```bash
#!/bin/bash
# save as: backup-llm-server.sh

BACKUP_DIR="/backup/llm-server"
DB_PATH="/var/lib/llm_server/llm_server.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/llm_server_$DATE.db
gzip $BACKUP_DIR/llm_server_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete

echo "Backup completed: llm_server_$DATE.db.gz"
```

**Schedule with cron:**

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-llm-server.sh
```

### Restore Database

```bash
# Stop service
sudo systemctl stop llm-server

# Restore
gunzip -c /backup/llm_server_20260223.db.gz > /var/lib/llm_server/llm_server.db

# Start service
sudo systemctl start llm-server
```

---

## Troubleshooting

### Server Won't Start

**Check logs:**
```bash
sudo journalctl -u llm-server -n 50
```

**Common issues:**
- Port 3000 already in use: Change PORT in `.env`
- Database file permission: `sudo chown $USER /var/lib/llm_server/llm_server.db`
- Missing Node.js: Install Node.js 24.x

### Frontend Not Loading

**Check production build:**
```bash
cd web
npm run build
```

**Verify files:**
```bash
ls -la web/dist/
```

**Check Nginx config:**
```bash
sudo nginx -t
```

### API Errors

**Test health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Check database:**
```bash
ls -la /var/lib/llm_server/llm_server.db
```

### Build Failures

**Check llama.cpp directory:**
```bash
ls -la /opt/llama.cpp
```

**Check build dependencies:**
```bash
cmake --version
gcc --version
```

**For CUDA:**
```bash
nvidia-smi
nvcc --version
```

### High Memory Usage

**Check running processes:**
```bash
ps aux | grep node
```

**Monitor system resources:**
```bash
htop
# or
top
```

**Adjust Node.js memory limit:**
```bash
# In systemd service or PM2
NODE_OPTIONS="--max-old-space-size=4096" node server/index.js
```

---

## Performance Optimization

### 1. Enable Compression

Already enabled in production build. For Nginx:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 2. Caching

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Database Optimization

Database uses SQLite with auto-save. For better performance:
- Keep database file on fast storage (SSD)
- Regular backups
- Monitor database size

---

## Security Checklist

- [ ] Change default ports if needed
- [ ] Use strong environment variables
- [ ] Enable firewall (ufw)
- [ ] Keep Node.js and dependencies updated
- [ ] Use HTTPS in production
- [ ] Restrict API access if needed
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly
- [ ] Use service accounts (not root)

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev                    # Start backend dev server
cd web && npm run dev         # Start frontend dev server
npm test                       # Run tests

# Production
npm start                      # Start production server
cd web && npm run build       # Build frontend

# Service
sudo systemctl start llm-server    # Start
sudo systemctl stop llm-server     # Stop
sudo systemctl restart llm-server  # Restart
sudo systemctl status llm-server   # Status
sudo journalctl -u llm-server -f   # Logs

# Docker
docker-compose up -d           # Start
docker-compose down            # Stop
docker-compose logs -f         # Logs
docker-compose restart         # Restart
```

### Default Ports

- Backend API: 3000
- Frontend Dev: 5173
- API Docs: 3000/api-docs

### Important Paths

- Database: `/var/lib/llm_server/llm_server.db`
- llama.cpp: `/opt/llama.cpp`
- Models: `./models/`
- Logs: `sudo journalctl -u llm-server`

---

## Support

- **Documentation:** See [README.md](README.md)
- **API Reference:** http://localhost:3000/api-docs
- **Issues:** https://github.com/mepis/llm_server/issues

---

**Deployment Guide Version:** 1.0.0
**Last Updated:** February 23, 2026
