# Sprint 4: Navigation & Interaction Tools

**Duration:** 1 week  
**Phase:** Core Features (Phase 2)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's navigation API
- Handle async navigation operations
- Implement element waiting strategies
- Create reusable utility functions
- Standardize navigation responses to always include current URL for LLM context awareness
- Design interaction responses with clear success/failure states LLMs can evaluate

## Goal

Implement core browser interaction capabilities with predictable response structures for LLM tool chaining.

## Deliverables

- Navigation endpoints (`navigate`, `back`, `forward`, `reload`)
- Interaction endpoints (`click`, `type`)
- Wait utilities

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Navigation Implementation

- [ ] Implement `POST /sessions/:id/navigate`:
  ```javascript
  app.post('/sessions/:id/navigate', async (req, res) => {
    const { url, waitUntil = 'networkidle' } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.goto(url, { waitUntil, timeout: 30000 });
      res.json({ success: true, url: session.page.url() });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message,
        url: session.page.url()
      });
    }
  });
  ```
- [ ] Implement back/forward navigation:
  ```javascript
  app.post('/sessions/:id/back', async (req, res) => {
    await session.page.goBack();
    res.json({ success: true });
  });
  ```
- [ ] Implement page reload:
  ```javascript
  app.post('/sessions/:id/reload', async (req, res) => {
    await session.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    res.json({ success: true });
  });
  ```

### Day 2-3: Element Interaction

- [ ] Implement `POST /sessions/:id/click`:
  ```javascript
  app.post('/sessions/:id/click', async (req, res) => {
    const { selector } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await session.page.click(selector);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message,
        selector: req.body.selector
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/type`:
  ```javascript
  app.post('/sessions/:id/type', async (req, res) => {
    const { selector, text, keyboard = true } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.click(selector);
      await session.page.type(selector, text, { delay: 50 });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```
- [ ] Create element locator helpers in `src/utils/locator.js`

### Day 4-5: Integration & Testing

- [ ] Create navigation/interaction utilities
- [ ] Add request/response logging
- [ ] Test with sample pages (e.g., https://example.com, https://demo.playwright.dev/todomvc)
- [ ] Write integration tests for all navigation/interaction endpoints

## Pair Programming Recommendation

- Pair when implementing element interaction (Day 2-3)
- Pair when testing with real websites

## Troubleshooting Tips

- **Issue: Element not found** - Check selector is valid, try different selector types (CSS, XPath, text)
- **Issue: Navigation timeout** - Reduce waitUntil option, check network connectivity
- **Issue: Click fails due to shadow DOM** - Use `page.evaluate()` to access shadow DOM elements

## Acceptance Criteria

- Can navigate to URLs
- Can click elements
- Can type into elements
- Navigation waits timeout properly
- Errors are caught and reported
- All navigation responses include current URL for LLM context awareness
- Error messages provide actionable information for LLM retry strategies

## Next Sprint

[Sprint 5: Data Extraction & Screenshot](./sprint-05-data-extraction.md)

## Previous Sprint

[Sprint 3: Playwright Controller Foundation](./sprint-03-playwright-controller.md)
