# Knowledge Base

This document contains common issues, solutions, and troubleshooting tips for the LLM Assistance API.

## Common Issues & Solutions

### 1. Browser fails to launch

**Symptoms:**
- Error messages about browser not found
- Connection refused errors

**Solutions:**
- Check Node.js version compatibility (v24.12.0+)
- Verify Playwright browser installation: `npx playwright install --with-deps`
- Try launching with `{ headless: false }` to debug visually
- Check if DISPLAY environment variable is set (for non-headless mode)

### 2. Element not found errors

**Symptoms:**
- `TimeoutError: Waiting for selector`
- `Error: strict mode violation`

**Solutions:**
- Check selector is valid using browser DevTools
- Try different selector types (CSS, XPath, text)
- Add wait time before interaction: `await page.waitForSelector(selector)`
- Check if element is inside an iframe or shadow DOM
- Use `page.waitForLoadState('networkidle')` before interaction

### 3. JavaScript evaluation fails

**Symptoms:**
- `Evaluation failed` errors
- `TypeError` from evaluated code

**Solutions:**
- Check for async/await in code
- Handle errors in try/catch
- Use `console.log()` in evaluated code for debugging
- Ensure code returns a serializable value
- Check for undefined variables in page context

### 4. Session timeout

**Symptoms:**
- Session not found errors
- Browser context closed

**Solutions:**
- Check session is still active: `sessionStore.get(sessionId).status`
- Verify timeout configuration in environment variables
- Create new session if needed
- Implement session keep-alive for long-running operations

### 5. Rate limiting

**Symptoms:**
- 429 Too Many Requests responses
- Request delays

**Solutions:**
- Check rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Adjust rate limit configuration if needed
- Implement exponential backoff in client
- Use separate sessions for parallel operations

## LLM-Specific Issues & Solutions

### 1. LLM can't parse response format

**Symptoms:**
- LLM fails to extract data from responses
- Inconsistent tool-calling behavior

**Solutions:**
- Ensure all responses use consistent structure (success, data, error)
- Add response schema documentation to OpenAPI spec
- Include example responses in documentation
- Use JSON responses consistently
- Include type information for result values

### 2. LLM loses track of session state

**Symptoms:**
- LLM tries to use closed sessions
- Confusion about current page state

**Solutions:**
- Include session status in all responses
- Add session context to error messages
- Consider adding session summary endpoint
- Return current URL after every navigation
- Include viewport and page title in responses

### 3. LLM doesn't handle errors gracefully

**Symptoms:**
- LLM gives up after first error
- No retry attempts

**Solutions:**
- Make error messages actionable and specific
- Include error codes for pattern matching
- Add suggested recovery actions to error responses
- Distinguish between transient and permanent errors
- Include retry-after information for rate limits

### 4. LLM generates malformed selectors

**Symptoms:**
- Invalid selector syntax errors
- Unexpected behavior from selectors

**Solutions:**
- Add selector validation/sanitization
- Provide selector format examples in docs
- Return helpful error messages for invalid selectors
- Suggest alternative selector formats
- Include common selector patterns in documentation

### 5. LLM tool-calling fails mid-workflow

**Symptoms:**
- Broken multi-step sequences
- Lost context between calls

**Solutions:**
- Ensure session persistence across calls
- Add idempotency where possible
- Include workflow context in responses
- Return previous action results
- Implement transaction-like behavior for critical operations

## Performance Tips

### 1. Browser Context Reuse

- Reuse browser instances across sessions when possible
- Create contexts per session, not per page
- Close contexts immediately when session ends
- Limit maximum concurrent sessions

### 2. Network Optimization

- Use `waitUntil: 'domcontentloaded'` instead of `'networkidle'` when appropriate
- Implement request interception for unnecessary resources
- Use browser context storage for caching
- Consider service worker blocking for static assets

### 3. Memory Management

- Clear browser context storage regularly
- Close pages immediately after use
- Implement garbage collection for old sessions
- Monitor heap usage with Node.js inspector

## Security Best Practices

### 1. Input Validation

- Always sanitize URLs before navigation
- Validate selectors to prevent injection
- Limit JavaScript evaluation to safe operations
- Implement content security policies

### 2. Session Security

- Use UUID v4 for session IDs (unpredictable)
- Implement session expiration
- Limit session creation rate
- Clean up sessions on server shutdown

### 3. Rate Limiting

- Implement per-session rate limits
- Add global rate limits for abuse prevention
- Use sliding window algorithms
- Include rate limit headers in responses

## Monitoring & Debugging

### 1. Logging

- Log all API requests with timestamps
- Include session ID in all logs
- Log browser console messages
- Track error patterns over time

### 2. Metrics to Track

- Session creation/deletion rates
- Average response times
- Error rates by type
- Browser resource usage
- Concurrent session counts

### 3. Health Checks

- Implement `/health` endpoint
- Check browser availability
- Verify session storage health
- Monitor memory usage

## Return to Index

[Sprint Plan Index](../sprint_plan.md)
