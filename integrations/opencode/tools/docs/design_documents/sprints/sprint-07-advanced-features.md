# Sprint 7: Advanced Features

**Duration:** 1 week  
**Phase:** Advanced Features (Phase 3)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's waiting strategies
- Configure browser context properties
- Implement flexible wait conditions
- Handle browser emulation
- Configure wait utilities with sensible defaults that work for LLM typical use cases
- Design browser configuration APIs LLMs can use for device/user-agent emulation

## Goal

Implement advanced browser configuration and synchronization optimized for LLM workflows.

## Deliverables

- Wait utilities
- Viewport configuration
- User agent and headers

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Waiting & Synchronization Implementation

- [ ] Implement `POST /sessions/:id/wait-for`:
  ```javascript
  app.post('/sessions/:id/wait-for', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    
    try {
      const { condition, timeout = 30000 } = req.body;
      
      if (condition.type === 'selector') {
        await session.page.waitForSelector(condition.selector, { 
          state: condition.state || 'visible',
          timeout
        });
      } else if (condition.type === 'network') {
        await session.page.waitForLoadState(condition.state || 'networkidle');
      } else if (condition.type === 'function') {
        await session.page.evaluate(condition.code);
      }
      
      res.json({ success: true, condition: condition.type });
    } catch (error) {
      res.status(504).json({ 
        success: false, 
        error: error.message,
        condition: condition.type
      });
    }
  });
  ```
- [ ] Implement network idle wait
- [ ] Implement DOMContentLoaded wait

### Day 2-3: Browser Configuration

- [ ] Implement `POST /sessions/:id/set-viewport`:
  ```javascript
  app.post('/sessions/:id/set-viewport', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    
    try {
      const { width, height, device = null } = req.body;
      
      if (device) {
        const devices = await session.browserContext.devices();
        const selectedDevice = devices.find(d => d.name === device);
        await session.browserContext.setViewport({ 
          width: selectedDevice.viewport.width,
          height: selectedDevice.viewport.height 
        });
        await session.browserContext.setExtraHTTPHeaders({
          'User-Agent': selectedDevice.userAgent
        });
      } else if (width && height) {
        await session.browserContext.setViewport({ width, height });
      }
      
      res.json({ 
        success: true, 
        viewport: { width, height },
        device: device || 'custom'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/set-user-agent`:
  ```javascript
  app.post('/sessions/:id/set-user-agent', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.browserContext.setExtraHTTPHeaders({
        'User-Agent': req.body.userAgent
      });
      res.json({ success: true, userAgent: req.body.userAgent });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/set-extra-headers`

### Day 4-5: Integration & Testing

- [ ] Test viewport changes with different device types
- [ ] Test user agent changes
- [ ] Test waiting utilities with various conditions
- [ ] Write integration tests for all advanced feature endpoints

## Pair Programming Recommendation

- Pair when implementing waiting utilities (Day 1)
- Pair when testing with device emulation (Day 2-3)

## Troubleshooting Tips

- **Issue: Wait times out** - Reduce timeout value, try different wait states (domcontentloaded, load, networkidle)
- **Issue: Viewport not changing** - Ensure browser context exists, check if viewport was already set
- **Issue: User-Agent not changing** - Use `setExtraHTTPHeaders` instead of direct context method

## Acceptance Criteria

- Viewport can be changed
- User agent can be set
- Headers can be added
- Wait utilities work correctly
- Integration with other tools works
- Wait utilities have sensible timeouts for LLM interaction patterns
- Browser configuration responses confirm changes for LLM verification

## Next Sprint

[Sprint 8: JavaScript Execution](./sprint-08-javascript-execution.md)

## Previous Sprint

[Sprint 6: Form Handling](./sprint-06-form-handling.md)
