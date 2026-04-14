# Sprint 6: Form Handling

**Duration:** 1 week  
**Phase:** Core Features (Phase 2)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Playwright's form handling API
- Handle file uploads and dynamic content
- Implement form submission strategies
- Handle form validation errors
- Implement form handling with field-level error reporting LLMs can use for correction attempts
- Design form responses that enable LLMs to detect and handle validation feedback

## Goal

Implement comprehensive form handling capabilities with LLM-friendly error feedback.

## Deliverables

- Form filling endpoint
- Dropdown selection
- Checkbox/radio handling

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Form Filling Implementation

- [ ] Implement `POST /sessions/:id/fill-form`:
  ```javascript
  app.post('/sessions/:id/fill-form', async (req, res) => {
    const session = sessionStore.get(req.params.id);
    
    try {
      const { fields } = req.body;
      
      for (const [name, value] of Object.entries(fields)) {
        const selector = `input[name="${name}"], textarea[name="${name}"]`;
        await session.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        
        if (name.endsWith('.file')) {
          await session.page.setInputFiles(selector, value);
        } else {
          await session.page.type(selector, value, { delay: 50 });
        }
      }
      
      res.json({ success: true, filled: fields.length });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message,
        fields: req.body.fields
      });
    }
  });
  ```
- [ ] Create form field helper utilities in `src/utils/form.js`

### Day 2-3: Dropdown & Checkbox Handling

- [ ] Implement `POST /sessions/:id/select-option`:
  ```javascript
  app.post('/sessions/:id/select-option', async (req, res) => {
    const { selector, value, multiple = false } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.selectOption(selector, {
        label: value,
        multiple: multiple
      });
      res.json({ success: true, selected: value });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message,
        selector: req.body.selector
      });
    }
  });
  ```
- [ ] Implement `POST /sessions/:id/check`:
  ```javascript
  app.post('/sessions/:id/check', async (req, res) => {
    const { selector, checked = true } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.click(selector);
      res.json({ success: true, checked });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```

### Day 4: Form Submission

- [ ] Add form submission support:
  ```javascript
  app.post('/sessions/:id/submit-form', async (req, res) => {
    const { selector = 'form', method = 'post', url } = req.body;
    const session = sessionStore.get(req.params.id);
    
    try {
      await session.page.click(selector);
      await session.page.waitForURL(url, { timeout: 10000 });
      res.json({ success: true, url: session.page.url() });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message
      });
    }
  });
  ```

### Day 5: Integration & Testing

- [ ] Test with sample forms (login forms, contact forms, search forms)
- [ ] Handle form validation errors gracefully
- [ ] Add form submission utilities
- [ ] Write integration tests for all form handling endpoints

## Pair Programming Recommendation

- Pair when testing with complex forms (Day 5)
- Pair when implementing form submission (Day 4)

## Troubleshooting Tips

- **Issue: Form field not found** - Check if field is inside a shadow DOM, try `page.evaluate()` to access
- **Issue: File upload fails** - Use `setInputFiles` instead of `type`, provide full file path
- **Issue: Form submission doesn't work** - Check for AJAX submission, use `waitForURL` to detect page change

## Acceptance Criteria

- Forms can be filled with text
- Dropdowns can be selected
- Checkboxes/radios can be toggled
- File uploads work
- Form validation is handled
- Form errors are reported at field level for LLM correction
- Form submission responses enable LLMs to verify success/failure

## Next Sprint

[Sprint 7: Advanced Features](./sprint-07-advanced-features.md)

## Previous Sprint

[Sprint 5: Data Extraction & Screenshot](./sprint-05-data-extraction.md)
