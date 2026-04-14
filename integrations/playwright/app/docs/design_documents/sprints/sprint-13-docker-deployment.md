# Sprint 13: Docker & Deployment Prep

**Duration:** 1 week  
**Phase:** Quality & Deployment (Phase 5)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Docker fundamentals
- Create multi-stage Docker builds
- Configure Docker Compose
- Prepare for deployment
- Configure deployment for optimal LLM API response times
- Design containerized environment for reliable LLM tool execution

## Goal

Prepare for containerization and deployment optimized for LLM tool calling latency.

## Deliverables

- Dockerfile
- Docker Compose
- Environment templates
- Deployment config

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Docker image builds successfully
- [ ] Docker Compose works with all services
- [ ] Environment variables documented
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Dockerfile Creation

- [ ] Create `Dockerfile`:
  ```dockerfile
  FROM node:24-alpine AS builder
  
  WORKDIR /app
  
  # Copy package files
  COPY package*.json ./
  
  # Install dependencies
  RUN npm ci --only=production
  RUN npm install --global nodemon
  
  # Copy source code
  COPY . .
  
  # Build application
  RUN npm run build 2>&1 || true
  
  # Multi-stage: Create smaller runtime image
  FROM node:24-alpine AS runtime
  
  WORKDIR /app
  
  # Copy node_modules from builder
  COPY --from=builder /app/node_modules ./node_modules
  
  # Copy built application
  COPY --from=builder /app/dist ./dist
  
  # Set environment
  ENV NODE_ENV=production
  ENV PORT=3000
  
  # Expose port
  EXPOSE 3000
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --command="node -e 'fetch(\"http://localhost:3000/health\").then(r=>r.ok||process.exit(1))'"
  
  # Start command
  CMD ["node", "dist/index.js"]
  ```
- [ ] Create `docker-compose.yml`:
  ```yaml
  version: '3.8'
  
  services:
    app:
      build:
        context: .
        target: runtime
      ports:
        - "3000:3000"
      environment:
        - NODE_ENV=development
        - PORT=3000
        - MAX_SESSIONS=10
        - SESSION_TIMEOUT=300000
      volumes:
        - .:/app
        - /app/node_modules
      command: npm run dev
      healthcheck:
        test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health').then(r=>r.ok||process.exit(1))"]
        interval: 30s
        timeout: 3s
        retries: 3
        start_period: 5s
  
  volumes:
    node_modules:
  ```
- [ ] Add multi-stage build
- [ ] Optimize image size

### Day 2-3: Environment Configuration

- [ ] Create `.env.example`:
  ```bash
  # Server
  PORT=3000
  NODE_ENV=development
  
  # Browser
  BROWSER=chromium
  HEADLESS=true
  SLOW_MO=0
  
  # Session
  MAX_SESSIONS=10
  SESSION_TIMEOUT=300000
  
  # CORS
  CORS_ORIGIN=*
  
  # Rate Limiting
  RATE_LIMIT_MAX=100
  RATE_LIMIT_WINDOW_MS=60000
  ```
- [ ] Create environment templates
- [ ] Document required variables
- [ ] Add Docker health checks

### Day 4-5: Deployment Configuration

- [ ] Create deployment config in `src/config/deploy.js`
- [ ] Add health check endpoints
- [ ] Create startup scripts in `src/scripts/`
- [ ] Document deployment steps in `docs/deployment.md`

## Pair Programming Recommendation

- Pair when creating Dockerfile (Day 1)
- Pair when testing Docker Compose (Day 2-3)

## Troubleshooting Tips

- **Issue: Docker build fails** - Check Node.js version compatibility, verify all dependencies are installed
- **Issue: Container won't start** - Check logs: `docker logs <container_id>`, verify health check is working
- **Issue: Image too large** - Use multi-stage build, remove dev dependencies in production image

## Acceptance Criteria

- Docker image builds successfully
- Container runs correctly
- Environment variables work
- Health checks pass
- Deployment is documented
- API response times meet LLM tool-calling latency requirements
- Container health checks verify LLM API availability

## Next Sprint

[Sprint 14: Polish & Final Testing](./sprint-14-polish-final-testing.md)

## Previous Sprint

[Sprint 12: Testing Suite](./sprint-12-testing-suite.md)
