# LLM Server Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:24-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY web/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build backend
FROM node:24-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Stage 3: Production image
FROM node:24-alpine

# Install system dependencies for llama.cpp builds
RUN apk add --no-cache \
    bash \
    git \
    cmake \
    make \
    g++ \
    python3

# Create app user
RUN addgroup -g 1001 -S llmserver && \
    adduser -S llmserver -u 1001

# Set working directory
WORKDIR /app

# Copy backend dependencies from builder
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy backend source
COPY server ./server
COPY package*.json ./
COPY .env.example ./

# Copy frontend build from builder
COPY --from=frontend-builder /app/web/dist ./web/dist

# Create data directory
RUN mkdir -p /app/data && \
    chown -R llmserver:llmserver /app

# Switch to app user
USER llmserver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/llm_server.db

# Start server
CMD ["node", "server/index.js"]
