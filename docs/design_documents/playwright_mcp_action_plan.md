# Playwright MCP Integration - Action Plan

**Date:** 2026-04-09  
**Status:** In Progress  
**Timeline:** 4 Weeks (16 days)  
**Related:** [Design Document](./playwright_mcp_server_design.md)

---

## Configuration Summary

| Setting | Value | Notes |
|---------|-------|-------|
| Browser | Chromium | Fastest, most compatible |
| Mode | Headed | Visible browser window |
| Profile | Persistent | Maintain login state |
| Action Timeout | 10s | Default |
| Navigation Timeout | 60s | Default |
| Output Dir | `./data/playwright/screenshots` | Relative to repo root |

---

## MCP Configuration

Add to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "@playwright/mcp@latest"],
      "args": [
        "--browser=chromium",
        "--output-dir=./data/playwright/screenshots",
        "--timeout-action=10000",
        "--timeout-navigation=60000"
      ],
      "enabled": true
    }
  }
}
```

---

## Phase 1: Environment Setup (Days 1-4)

### Day 1-2: Environment Setup

- [ ] Verify Node.js version (>= 18.x)
  - Command: `node --version`
  - Expected: v18.x or higher
  
- [ ] Check OpenCode MCP config location
  - Path: `~/.config/opencode/opencode.json`
  - Verify file exists
  
- [ ] Install Playwright browsers
  - Command: `npx playwright install chromium`
  - Time: ~5 minutes
  - Space: ~1GB
  
- [ ] Test MCP CLI
  - Command: `npx @playwright/mcp@latest --help`
  - Verify CLI responds

### Day 3-4: Basic Configuration

- [ ] Create output directory
  - Path: `./data/playwright/screenshots`
  - Command: `mkdir -p ./data/playwright/screenshots`
  
- [ ] Add MCP config to OpenCode
  - File: `~/.config/opencode/opencode.json`
  - Use configuration above
  
- [ ] Restart OpenCode
  - Reload to pick up new MCP server
  
- [ ] Verify tool discovery
  - Ask OpenCode: "What browser automation tools are available?"
  - Verify tool list is returned
  
- [ ] Test basic navigation
  - Ask: "Navigate to https://httpbin.org"
  - Verify browser opens and navigates

**Phase 1 Success Criteria:**
- [ ] MCP Server connects successfully
- [ ] Tools are discoverable in OpenCode
- [ ] No connection errors in logs
- [ ] Browser opens in headed mode
- [ ] Basic navigation works

---

## Phase 2: Core Features (Days 5-8)

### Day 5-6: Navigation Tools

- [ ] Test `browser_navigate`
  - Navigate to https://httpbin.org
  - Verify accessibility snapshot returned
  - Check element refs are present
  
- [ ] Test `browser_snapshot`
  - Take snapshot of current page
  - Verify page structure is readable
  - Check refs are consistent
  
- [ ] Test `browser_navigate_back`
  - Navigate to page A (https://example.com)
  - Navigate to page B (https://httpbin.org)
  - Go back, verify return to page A
  
- [ ] Test `browser_tabs`
  - Create new tab with action="new"
  - Switch to tab with action="select", index=1
  - Close tab with action="close", index=1
  - Verify tab count changes correctly

### Day 7-8: Interaction Tools

- [ ] Test `browser_click`
  - Navigate to test page with buttons
  - Get snapshot to find button ref
  - Click button using ref
  - Verify action succeeds
  
- [ ] Test `browser_type`
  - Find input field in snapshot
  - Type test text into field
  - Verify text appears in field
  
- [ ] Test `browser_hover`
  - Find element with dropdown menu
  - Hover over element
  - Verify dropdown appears in snapshot
  
- [ ] Test `browser_press_key`
  - Open modal/dialog if available
  - Press Escape key
  - Verify modal closes

**Phase 2 Success Criteria:**
- [ ] Navigate to URLs works reliably
- [ ] Click elements works with refs
- [ ] Type text into inputs works
- [ ] Tab management (create/switch/close) works
- [ ] Accessibility snapshots are readable

---

## Phase 3: Advanced Features (Days 9-12)

### Day 9-10: Forms & File Upload

- [ ] Test `browser_fill_form`
  - Navigate to form page
  - Fill multiple fields at once
  - Verify all fields populated correctly
  
- [ ] Test `browser_select_option`
  - Find dropdown/select element
  - Select option by value
  - Verify selection in snapshot
  
- [ ] Test `browser_file_upload`
  - Create test file locally
  - Trigger file input
  - Upload file via tool
  - Verify upload succeeds
  
- [ ] Test complete form submission
  - Fill form with test data
  - Click submit button
  - Verify success message appears
  - Take screenshot of result

### Day 11-12: Network Mocking

- [ ] Test `browser_network_requests`
  - Navigate to page with API calls
  - List network requests
  - Verify requests captured
  - Check request/response data
  
- [ ] Test `browser_route` (mock API)
  - Set up mock route for API endpoint
  - Navigate to page that calls API
  - Verify mock response is used
  - Check page displays mock data
  
- [ ] Test `browser_unroute`
  - Remove mock route
  - Refresh page
  - Verify real API is called
  
- [ ] Test error state handling
  - Mock 500 error response
  - Navigate to page
  - Verify error UI appears
  - Take screenshot of error state

**Phase 3 Success Criteria:**
- [ ] Multi-field form fill works
- [ ] Dropdown selection works
- [ ] File upload works
- [ ] Network request capture works
- [ ] API mocking works
- [ ] Error state testing works

---

## Phase 4: Polish & Production (Days 13-16)

### Day 13-14: Error Handling

- [ ] Test timeout scenarios
  - Navigate to slow-loading page
  - Verify timeout behavior
  - Check error message is clear
  - Test with custom timeout
  
- [ ] Test element not found
  - Try to click non-existent ref
  - Verify helpful error message
  - Check snapshot is still available
  
- [ ] Test navigation failures
  - Navigate to invalid URL (http://invalid.domain.test)
  - Verify error handling
  - Check browser is still usable
  
- [ ] Implement recovery patterns
  - Document retry logic for flaky elements
  - Test automatic recovery after errors
  - Verify browser can continue after failures

### Day 15-16: Documentation

- [ ] Create usage guide
  - Quick start tutorial
  - Common patterns and examples
  - Troubleshooting guide
  
- [ ] Document tool schemas
  - List all 40+ available tools
  - Input/output examples for each
  - Error codes and meanings
  
- [ ] Create example workflows
  - Login flow example (navigate → fill → submit)
  - Form submission example (fill multi-field form)
  - Data scraping example (navigate → snapshot → extract)
  
- [ ] Update AGENTS.md
  - Add Playwright MCP section
  - Include configuration example
  - Add troubleshooting tips
  - Document common use cases

**Phase 4 Success Criteria:**
- [ ] All errors handled gracefully
- [ ] Timeouts are configurable and respected
- [ ] Documentation is complete and clear
- [ ] Examples cover common use cases
- [ ] AGENTS.md updated with Playwright section

---

## Test Checklist

### Navigation Tests
- [ ] Navigate to HTTP site (http://httpbin.org)
- [ ] Navigate to HTTPS site (https://example.com)
- [ ] Navigate to invalid URL (error handling)
- [ ] Navigate back/forward in history
- [ ] Open multiple tabs
- [ ] Switch between tabs
- [ ] Close tabs

### Interaction Tests
- [ ] Click button element
- [ ] Click link element
- [ ] Type text in input field
- [ ] Select dropdown option
- [ ] Check/uncheck checkbox
- [ ] Hover over element
- [ ] Press keyboard keys

### Form Tests
- [ ] Fill single field
- [ ] Fill multiple fields at once
- [ ] Submit form
- [ ] Handle validation errors
- [ ] Upload file
- [ ] Select from dropdown

### Network Tests
- [ ] Capture network requests
- [ ] Mock API response (200 OK)
- [ ] Mock error response (500 error)
- [ ] Verify request headers
- [ ] Remove mock routes

### Error Tests
- [ ] Timeout on slow page
- [ ] Element not found error
- [ ] Navigation failed error
- [ ] Browser crash recovery
- [ ] Network error handling

---

## Progress Tracking

### Current Phase: Phase 1 (Environment Setup)

**Completed Tasks:**
- [ ] Node.js version verified
- [ ] Playwright browsers installed
- [ ] Output directory created
- [ ] MCP configuration added
- [ ] Tool discovery verified

**Pending Tasks:**
- [ ] Basic navigation test
- [ ] Phase 1 success criteria met

### Phase Status

```
Phase 1: Environment Setup    [====        ] 25%
Phase 2: Core Features        [            ] 0%
Phase 3: Advanced Features    [            ] 0%
Phase 4: Polish & Production  [            ] 0%
```

---

## Quick Reference Commands

### Install Playwright
```bash
npx playwright install chromium
```

### Test MCP Server
```bash
npx @playwright/mcp@latest --help
```

### Check OpenCode Config
```bash
cat ~/.config/opencode/opencode.json
```

### View Screenshots
```bash
ls -la ./data/playwright/screenshots/
```

---

## Notes

- Persistent profile location: `~/.cache/ms-playwright/mcp-chromium-{workspace-hash}`
- Browser runs in headed mode (visible window)
- All screenshots saved to `./data/playwright/screenshots/`
- Default timeouts: 10s action, 60s navigation

---

**Last Updated:** 2026-04-09  
**Next Review:** After Phase 1 completion
