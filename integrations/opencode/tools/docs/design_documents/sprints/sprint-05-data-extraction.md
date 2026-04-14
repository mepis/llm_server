# Sprint 5: Data Extraction & Screenshot

**Duration:** 1 week  
**Phase:** Core Features (Phase 2)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's screenshot API
- Handle binary data (PNG, JPEG, Base64)
- Extract text and HTML content
- Implement JavaScript evaluation safely
- Design data extraction responses with clear success/failure flags LLMs can easily evaluate
- Structure extracted data in formats LLMs can consume and reason about

## Goal

Implement data extraction and screenshot capabilities optimized for LLM content analysis.

## Deliverables

- Screenshot capture endpoints
- Data extraction endpoints (HTML, text, attributes)
- JavaScript evaluation

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Screenshot Implementation

- [ ] Implement `POST /sessions/:id/screenshot`:
  ```javascript
  app.post('/sessions/:id/screenshot', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    
    try {
      const screenshot = await session.page.screenshot({
        type: 'png',
        fullPage: req.body.fullPage === true,
        quality: req.body.quality || 100
      });
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': screenshot.length
      });
      res.send(screenshot);
      
      res.json({
        success: true,
        format: 'png',
        size: screenshot.length,
        fullPage: req.body.fullPage === true
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  ```
- [ ] Handle PNG/JPEG output
- [ ] Add screenshot metadata (timestamp, viewport, URL)

### Day 2-3: Data Extraction

- [ ] Implement `GET /sessions/:id/content` - Get HTML:
  ```javascript
  app.get('/sessions/:id/content', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    res.json({
      success: true,
      content: session.page.content()
    });
  });
  ```
- [ ] Implement `GET /sessions/:id/text` - Get text content:
  ```javascript
  app.get('/sessions/:id/text', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    res.json({
      success: true,
      text: await session.page.evaluate(() => document.body.innerText)
    });
  });
  ```
- [ ] Implement `GET /sessions/:id/attributes/:selector` - Get attributes:
  ```javascript
  app.get('/sessions/:id/attributes/:selector', async (req, res) => {
    const { selector } = req.params;
    const session = sessionStore.get(req.params.id);
    
    try {
      const attributes = await session.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        return {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          innerText: element.innerText,
          attributes: Array.from(element.attributes).map(a => ({
            name: a.name,
            value: a.value
          }))
        };
      }, selector);
      
      res.json({ success: true, attributes });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  ```
- [ ] Create utility functions for common extractions in `src/utils/extractor.js`

### Day 4-5: JavaScript Evaluation

- [ ] Implement `POST /sessions/:id/evaluate`:
  ```javascript
  app.post('/sessions/:id/evaluate', async (req, res) => {
    const { code } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      const result = await session.page.evaluate(code);
      res.json({
        success: true,
        result,
        type: typeof result
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        code: req.body.code
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/addInitScript`
- [ ] Add console message capture

## Pair Programming Recommendation

- Pair when implementing JavaScript evaluation (Day 4-5)
- Pair when testing with complex JavaScript pages

## Troubleshooting Tips

- **Issue: Screenshot is black/empty** - Check if page is loaded, try `waitForTimeout(500)` before screenshot
- **Issue: JavaScript evaluation fails** - Check for async/await in code, handle errors in try/catch
- **Issue: Text extraction returns empty** - Check if page is fully loaded, try `waitForSelector('*')`

## Acceptance Criteria

- Screenshots capture correctly
- HTML/text extraction works
- JavaScript evaluation returns results
- Element attributes are extracted
- Errors are handled gracefully
- Data extraction responses include metadata LLMs can use for context
- JavaScript evaluation returns structured results LLMs can parse

## Next Sprint

[Sprint 6: Form Handling](./sprint-06-form-handling.md)

## Previous Sprint

[Sprint 4: Navigation & Interaction Tools](./sprint-04-navigation-interaction.md)
