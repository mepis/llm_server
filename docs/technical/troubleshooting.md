# Troubleshooting

This document covers common issues and their solutions for LLM Server, helping you diagnose and resolve problems quickly.

---

## Overview

This guide provides solutions for common issues encountered when running LLM Server, from startup problems to runtime errors.

### Common Issues

```
┌─────────────────────────────────────────────────────────────────┐
│                    Common Issues                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │  Startup     │  Server fails to start                        │
│  │  Issues      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Connection │  Database or service connection failures      │
│  │  Issues      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Runtime     │  Errors during operation                      │
│  │  Errors      │                                               │
│  │              │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Performance │  Slow responses, high resource usage         │
│  │  Issues      │                                               │
│  │              │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Startup Issues

### MongoDB Connection Failed

**Symptom:** Server fails to start with connection timeout

```
Error: connect ECONNREFUSED localhost:27017
```

**Solutions:**

1. **Check MongoDB is running**
   ```bash
   # Linux
   systemctl status mongod
   
   # macOS
   brew services list
   
   # Or start manually
   mongod --dbpath /path/to/data/db
   ```

2. **Verify connection string**
   ```bash
   # Check .env file
   cat .env | grep MONGODB_URI
   ```

3. **Reduce timeout values**
   ```bash
   # In .env
   MONGODB_OPTIONS=socketTimeoutMS=30000,connectTimeoutMS=5000
   ```

---

### Port Already in Use

**Symptom:** Server fails to bind to port

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill process**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Change port**
   ```bash
   # In .env
   PORT=3001
   ```

---

### Missing Dependencies

**Symptom:** Module not found errors

```
Error: Cannot find module 'express'
```

**Solutions:**

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Clear node_modules**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## Connection Issues

### Llama.cpp Connection Failed

**Symptom:** LLM inference fails

```
Error: connect ECONNREFUSED localhost:8082
```

**Solutions:**

1. **Check Llama.cpp is running**
   ```bash
   curl http://localhost:8082/v1/models
   ```

2. **Verify server URL**
   ```bash
   # In .env
   LLAMA_SERVER_URL=http://localhost:8082
   ```

3. **Check Llama.cpp logs**
   ```bash
   # If running in container
   docker logs llama
   
   # If running manually
   # Check terminal where llama.cpp is running
   ```

---

### Database Query Timeout

**Symptom:** Queries take too long

```
Error: socket timeout
```

**Solutions:**

1. **Add indexes**
   ```javascript
   db.users.createIndex({ username: 1 }, { unique: true });
   db.chatSessions.createIndex({ user_id: 1, updated_at: -1 });
   ```

2. **Increase timeout**
   ```bash
   # In .env
   MONGODB_OPTIONS=socketTimeoutMS=60000,connectTimeoutMS=10000
   ```

3. **Check for slow queries**
   ```javascript
   db.getProfilingLevel();
   db.setProfilingLevel(2);
   ```

---

## Runtime Errors

### JWT Token Expired

**Symptom:** 401 Unauthorized errors

```
Error: Token expired
```

**Solutions:**

1. **Login again**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "johndoe", "password": "password"}'
   ```

2. **Increase token expiration**
   ```bash
   # In .env
   JWT_EXPIRES_IN=30d
   ```

3. **Implement token refresh**
   ```javascript
   // Frontend
   async function refreshToken() {
     const newToken = await axios.post('/api/auth/refresh', { token: oldToken });
     localStorage.setItem('token', newToken.data.token);
   }
   ```

---

### Rate Limit Exceeded

**Symptom:** 429 Too Many Requests

```
Error: Too many requests from this IP
```

**Solutions:**

1. **Wait and retry**
   ```javascript
   // Wait 15 minutes before retrying
   setTimeout(() => {
     axios.request(config);
   }, 900000);
   ```

2. **Increase rate limit**
   ```javascript
   // In rate limiter config
   windowMs: 60 * 60 * 1000, // 1 hour
   max: 1000, // 1000 requests
   ```

---

### Password Hashing Slow

**Symptom:** Registration/login takes too long

```
Error: Hashing took too long
```

**Solutions:**

1. **Verify worker pool is running**
   ```bash
   # Check worker pool
   npm run worker
   ```

2. **Reduce hash cost (not recommended for production)**
   ```javascript
   // In password hashing
   memoryCost: 32768, // Reduced from 65536
   timeCost: 2,       // Reduced from 3
   ```

---

## Performance Issues

### Slow Response Times

**Symptom:** Requests take > 5 seconds

**Diagnosis:**

1. **Check logs**
   ```bash
   # View recent logs
   tail -f logs/combined.log
   ```

2. **Check database**
   ```javascript
   // Check slow queries
   db.currentOp();
   ```

3. **Check worker pool**
   ```javascript
   console.log('Active threads:', piscina.workingThreads);
   console.log('Idle threads:', piscina.idleThreads);
   ```

**Solutions:**

1. **Add database indexes**
   ```javascript
   db.collection.createIndex({ field: 1 });
   ```

2. **Enable caching**
   ```javascript
   const cache = new Cache();
   const cached = await cache.get('llama_models');
   if (cached) {
     return cached;
   }
   ```

3. **Increase worker threads**
   ```bash
   # Adjust in worker pool config
   maxThreads: 8
   ```

---

### High Memory Usage

**Symptom:** Node.js process uses > 80% memory

**Diagnosis:**

1. **Check memory usage**
   ```bash
   # Linux
   top -p $(pgrep node)
   
   # macOS
   top -pid $(pgrep node)
   ```

2. **Check for leaks**
   ```bash
   # Use Node.js heap profiler
   node --inspect node_modules/nodelib/inspect.js
   ```

**Solutions:**

1. **Clear caches**
   ```javascript
   cache.clear();
   ```

2. **Reduce worker pool size**
   ```javascript
   maxThreads: 4; // Reduce from 8
   ```

3. **Optimize database queries**
   ```javascript
   // Use projection to reduce data
   const user = await User.findOne({ _id: id }, { password: 0 });
   ```

---

## Configuration Issues

### Environment Variables Not Loading

**Symptom:** Variables not available in code

**Solutions:**

1. **Check .env file exists**
   ```bash
   ls -la .env
   ```

2. **Check file is in correct location**
   ```bash
   pwd
   ls .env
   ```

3. **Verify variable names match**
   ```bash
   # In .env
   MONGODB_URI=mongodb://localhost:27017/llm_server
   
   # Should match exactly (case-sensitive)
   ```

---

## Debugging Tips

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=debug
```

### View Request Logs

```bash
# Watch logs in real-time
tail -f logs/combined.log
```

### Check Worker Pool Status

```javascript
// In server code
console.log({
  active: piscina.workingThreads,
  idle: piscina.idleThreads,
  waiting: piscina.waitingTasks
});
```

### Test Database Connection

```javascript
// In Node.js REPL
await db.admin().ping();
console.log('Connection: OK');
```

---

## Tags

- `troubleshooting` - Troubleshooting guide
- `debugging` - Debug tips
- `performance` - Performance issues

---

## Related Documentation

- [Configuration Guide](./configuration-guide.md) - Environment variables
- [Deployment Guide](./deployment-guide.md) - Production setup
- [Performance Guide](./performance-guide.md) - Optimization
