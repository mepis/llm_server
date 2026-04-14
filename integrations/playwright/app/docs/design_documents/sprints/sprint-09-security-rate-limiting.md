# Sprint 9: Security & Rate Limiting

**Duration:** 1 week  
**Phase:** Production Readiness (Phase 4)  
**Status:** ⏳ Pending

## Learning Objectives

- Implement rate limiting strategies
- Understand input sanitization
- Configure CORS properly
- Add security headers
- Implement rate limiting with clear headers LLMs can monitor and adapt to
- Design security error responses that LLMs can understand and respond to

## Goal

Implement security features and rate limiting with LLM-friendly feedback mechanisms.

## Deliverables

- Rate limiting per session
- Input sanitization
- CORS configuration

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Security review completed
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Rate Limiting Implementation

- [ ] Implement rate limiting middleware:
  ```javascript
  const rateLimit = require('express-rate-limit');
  
  const sessionLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute per session
    keyGenerator: (req) => req.params.id, // Use session ID as key
    handler: (req, res) => {
      res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded',
        retryAfter: 60
      });
    }
  });
  
  app.use('/sessions/:id/*', sessionLimiter);
  ```
- [ ] Configure per-session limits based on environment
- [ ] Add rate limit headers to responses

### Day 2-3: Input Sanitization

- [ ] Create `src/utils/sanitizer.js` with utility functions:
  ```javascript
  const sanitizeUrl = (url) => {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  };
  
  const sanitizeSelector = (selector) => {
    const cleaned = selector.replace(/[<>\"'\\]/g, '');
    return cleaned;
  };
  
  const sanitizeJavaScript = (code) => {
    return code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
  };
  ```
- [ ] Sanitize URLs
- [ ] Sanitize selectors
- [ ] Sanitize JavaScript

### Day 4: CORS & Security Headers

- [ ] Configure CORS properly:
  ```javascript
  const cors = require('cors');
  
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
  }));
  ```
- [ ] Add security headers:
  ```javascript
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'X-Permitted-Cross-Domain-Policies': 'master'
    });
    next();
  });
  ```
- [ ] Implement environment-based config

### Day 5: Integration & Testing

- [ ] Test rate limiting with concurrent requests
- [ ] Test input sanitization with various inputs
- [ ] Test CORS with different origins
- [ ] Write integration tests for security features
- [ ] Perform security review of code

## Pair Programming Recommendation

- Pair when implementing rate limiting (Day 1)
- Pair when performing security review (Day 5)

## Troubleshooting Tips

- **Issue: Rate limiting too restrictive** - Increase max value in rateLimit config
- **Issue: CORS not working** - Check CORS_ORIGIN environment variable, verify allowed methods
- **Issue: Sanitization breaks valid input** - Test with various inputs, adjust regex patterns

## Acceptance Criteria

- Rate limiting works
- Input is sanitized
- CORS is configured
- Security headers are set
- Environment variables work
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining) are included in responses
- Rate limit errors include retry-after information for LLM adaptation

## Next Sprint

[Sprint 10: Error Handling & Logging](./sprint-10-error-handling-logging.md)

## Previous Sprint

[Sprint 8: JavaScript Execution](./sprint-08-javascript-execution.md)
