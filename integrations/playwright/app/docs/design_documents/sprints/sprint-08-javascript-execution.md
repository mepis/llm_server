# Sprint 8: JavaScript Execution

**Duration:** 1 week  
**Phase:** Advanced Features (Phase 3)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's JavaScript execution API
- Handle async/await in page context
- Implement console message capture
- Create safe evaluation utilities
- Design JavaScript evaluation with explicit result LLMs can safely interpret
- Structure console output for LLM debugging and analysis

## Goal

Implement comprehensive JavaScript execution capabilities with LLM-friendly result formatting.

## Deliverables

- JavaScript evaluation endpoint
- Console message capture
- Page context utilities

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: JavaScript Execution Implementation

- [ ] Implement `POST /sessions/:id/evaluate`:
  ```javascript
  app.post('/sessions/:id/evaluate', async (req, res) => {
    const { code } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      console.log(`Evaluating code: ${code.substring(0, 100)}...`);
      
      const result = await session.page.evaluate(code);
      
      res.json({
        success: true,
        result,
        type: typeof result,
        code: req.body.code
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: req.body.code,
        stack: error.stack
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/addInitScript`:
  ```javascript
  app.post('/sessions/:id/addInitScript', async (req, res) => {
    const { code } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.browserContext.addInitScript({
        source: code
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```

### Day 2-3: Console Message Capture

- [ ] Implement console message capture:
  ```javascript
  app.get('/sessions/:id/console-messages', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    const messages = session.page.on('console').messages();
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        level: msg.type(),
        text: msg.text(),
        args: msg.args().map(arg => ({
          type: arg.type(),
          value: arg.value()
        }))
      }))
    });
  });
  ```
- [ ] Implement console message filtering by level

### Day 4: Async Function Support

- [ ] Handle async/await in evaluation:
  ```javascript
  app.post('/sessions/:id/evaluate-async', async (req, res) => {
    const { code } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      const result = await session.page.evaluate(async () => {
        return await Promise.resolve('ready');
      }, code);
      
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```

### Day 5: Integration & Testing

- [ ] Test with complex JavaScript (math functions, DOM manipulation, async operations)
- [ ] Test error handling with invalid code
- [ ] Test with async functions
- [ ] Write integration tests for all JavaScript execution endpoints

## Pair Programming Recommendation

- Pair when implementing console message capture (Day 2-3)
- Pair when testing with complex JavaScript (Day 5)

## Troubleshooting Tips

- **Issue: JavaScript evaluation returns undefined** - Check if code returns a value, use `console.log` in evaluated code
- **Issue: Async function doesn't work** - Wrap in Promise.resolve, ensure async/await is properly handled
- **Issue: Variable scope issues** - Use `window` or `window[variableName]` to access global variables

## Acceptance Criteria

- JavaScript evaluates correctly
- Results are returned properly
- Errors are caught and reported
- Console messages are captured
- Async functions work correctly
- JavaScript results are structured for LLM parsing
- Console messages include timestamps and levels for LLM analysis

## Next Sprint

[Sprint 9: Security & Rate Limiting](./sprint-09-security-rate-limiting.md)

## Previous Sprint

[Sprint 7: Advanced Features](./sprint-07-advanced-features.md)
