# Playwright MCP Server Design Document

**Date:** 2026-04-09  
**Project:** OpenCode Playwright Integration  
**Status:** Design Phase

---

## Executive Summary

This document outlines the design and implementation plan for integrating Playwright browser automation capabilities into OpenCode via the Model Context Protocol (MCP). The design leverages Microsoft's official `@playwright/mcp` server, which provides a comprehensive set of tools for browser automation through structured accessibility snapshots.

---

## 1. Overview

### 1.1 Purpose

Enable OpenCode to interact with web pages using Playwright's browser automation capabilities through MCP tools. This allows the AI agent to:
- Navigate to URLs
- Interact with page elements (click, type, hover)
- Take screenshots and accessibility snapshots
- Handle dialogs and file uploads
- Mock network requests
- Manage browser storage (cookies, localStorage)

### 1.2 Key Design Decision: Use Official Playwright MCP

**Decision:** Use Microsoft's official `@playwright/mcp` package rather than building a custom server.

**Rationale:**
1. **Production-ready**: Already battle-tested with extensive tool coverage
2. **Accessibility-first**: Uses Playwright's accessibility tree, not pixel-based vision
3. **Comprehensive**: 40+ tools covering all common browser automation scenarios
4. **Actively maintained**: Backed by Microsoft's Playwright team
5. **Token-efficient**: Structured data instead of images reduces context usage

**Trade-offs:**
- Less control over specific tool implementations
- Must work within the provided tool schema
- Custom tool additions require forking or wrapper patterns

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OpenCode                              │
│  (MCP Client - AI Agent)                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ MCP Protocol (stdio or HTTP)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 @playwright/mcp@latest                        │
│              (Official Playwright MCP Server)                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Tools Layer                       │    │
│  │  • browser_navigate                                  │    │
│  │  • browser_click                                     │    │
│  │  • browser_type                                      │    │
│  │  • browser_snapshot                                  │    │
│  │  • browser_take_screenshot                           │    │
│  │  • browser_run_code                                  │    │
│  │  • ... (40+ tools)                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                       │
│                       ▼                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Playwright Core                       │    │
│  │  • Browser Context Management                         │    │
│  │  • Page/Frame Operations                              │    │
│  │  • Accessibility Tree Extraction                      │    │
│  │  • Network Interception                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                       │
│                       ▼                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Browser Engines (Chromium/              │    │
│  │              Firefox/WebKit)                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Tool Categories

The official Playwright MCP server provides tools in these categories:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Core Automation** | `browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot` | Basic page interaction |
| **Navigation** | `browser_navigate_back`, `browser_tabs` | Browser navigation |
| **Input** | `browser_press_key`, `browser_hover`, `browser_drag` | Advanced input |
| **Forms** | `browser_fill_form`, `browser_select_option`, `browser_file_upload` | Form handling |
| **Media** | `browser_take_screenshot` | Visual capture |
| **Code Execution** | `browser_run_code`, `browser_evaluate` | Custom Playwright scripts |
| **Network** | `browser_network_requests`, `browser_route` | Network monitoring/mocking |
| **Storage** | `browser_cookie_*`, `browser_localstorage_*` | Browser storage management |
| **Debugging** | `browser_console_messages`, `browser_wait_for` | Debugging utilities |

---

## 3. Configuration for OpenCode

### 3.1 Installation Configuration

Add to OpenCode's MCP configuration (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": [
        "npx",
        "@playwright/mcp@latest"
      ],
      "args": [
        "--browser=chromium",
        "--headless"
      ],
      "enabled": true
    }
  }
}
```

### 3.2 Configuration Options

| Option | Description | Recommended Value |
|--------|-------------|-------------------|
| `--browser` | Browser engine | `chromium` (fastest, most compatible) |
| `--headless` | Run without UI | `true` (for background operations) |
| `--isolated` | Fresh session each time | `true` (for testing scenarios) |
| `--timeout-action` | Action timeout | `10000` (10 seconds) |
| `--timeout-navigation` | Navigation timeout | `60000` (60 seconds) |
| `--viewport-size` | Browser viewport | `1280x720` (standard) |
| `--output-dir` | Screenshot/output storage | `/tmp/playwright-mcp` |

### 3.3 Alternative: HTTP Transport

For environments where stdio is problematic:

```bash
# Start server separately
npx @playwright/mcp@latest --port 8931 --headless
```

```json
{
  "mcp": {
    "playwright": {
      "type": "http",
      "url": "http://localhost:8931/mcp",
      "enabled": true
    }
  }
}
```

---

## 4. Tool Usage Patterns

### 4.1 Basic Navigation and Interaction

```
User: "Go to https://example.com and click the 'Learn More' button"

OpenCode Tool Calls:
1. browser_navigate(url="https://example.com")
   → Returns accessibility snapshot with element refs
   
2. browser_snapshot()
   → Returns: - button "Learn More" [ref=e12]
   
3. browser_click(ref="e12", element="Learn More button")
   → Returns: Navigation result + new snapshot
```

### 4.2 Form Filling

```
User: "Fill out the contact form with name 'John' and email 'john@example.com'"

OpenCode Tool Calls:
1. browser_navigate(url="https://example.com/contact")

2. browser_fill_form(fields=[
    { ref: "e5", value: "John" },
    { ref: "e7", value: "john@example.com" }
  ])
   
3. browser_click(ref="e10", element="Submit button")
```

### 4.3 Complex Operations with Custom Code

```
User: "Scrape all product titles from the page"

OpenCode Tool Calls:
1. browser_navigate(url="https://example.com/products")

2. browser_run_code(code="
    async (page) => {
      const titles = await page.getByRole('heading').allTextContents();
      return titles.filter(t => t.includes('Product'));
    }
  ")
```

### 4.4 Network Mocking

```
User: "Test how the page behaves when the API returns an error"

OpenCode Tool Calls:
1. browser_route(pattern="**/api/users", status=500, body='{"error": "Server error"}')

2. browser_navigate(url="https://example.com/users")

3. browser_snapshot()
   → Shows error state UI
```

---

## 5. Security Considerations

### 5.1 Network Restrictions

Configure allowed/blocked origins to prevent unauthorized access:

```json
{
  "args": [
    "--allowed-origins=example.com;test.example.com",
    "--blocked-origins=evil.com"
  ]
}
```

### 5.2 File Access Restrictions

By default, file access is restricted to workspace roots. For testing with external files:

```json
{
  "args": [
    "--allow-unrestricted-file-access"
  ]
}
```

**Warning:** This should only be enabled in trusted environments.

### 5.3 Storage State Management

Use isolated sessions for testing to prevent state leakage:

```json
{
  "args": [
    "--isolated"
  ]
}
```

For persistent login state:

```json
{
  "args": [
    "--storage-state=/path/to/auth-state.json"
  ]
}
```

---

## 6. Implementation Plan

### Phase 1: Basic Integration (Week 1)

**Tasks:**
1. Add Playwright MCP to OpenCode configuration
2. Test basic navigation and interaction
3. Verify accessibility snapshot quality
4. Document basic usage patterns

**Success Criteria:**
- Can navigate to URLs
- Can click elements and type text
- Can take screenshots
- Accessibility snapshots are readable

### Phase 2: Advanced Features (Week 2)

**Tasks:**
1. Implement form filling workflows
2. Add network mocking capabilities
3. Test file upload handling
4. Implement custom code execution patterns

**Success Criteria:**
- Can complete multi-step form workflows
- Can mock API responses for testing
- Can handle file uploads
- Custom Playwright code executes correctly

### Phase 3: Optimization (Week 3)

**Tasks:**
1. Profile token usage for common operations
2. Optimize snapshot depth for context efficiency
3. Implement caching for repeated navigations
4. Add error handling patterns

**Success Criteria:**
- Token usage is reasonable (< 500 tokens per operation)
- Error recovery works correctly
- Common patterns are documented

### Phase 4: Production Hardening (Week 4)

**Tasks:**
1. Add comprehensive error handling
2. Implement timeout management
3. Add logging and observability
4. Create usage examples and documentation

**Success Criteria:**
- All error cases are handled gracefully
- Timeouts are configurable and respected
- Usage is observable and debuggable
- Documentation is complete

---

## 7. Comparison: MCP vs CLI Approach

### 7.1 MCP Approach (Recommended)

**Pros:**
- Persistent browser state across tool calls
- Rich introspection via accessibility snapshots
- Iterative reasoning over page structure
- Built-in tool discovery and validation

**Cons:**
- Higher token usage for accessibility trees
- Requires MCP client support
- More complex error handling

### 7.2 CLI Approach (Alternative)

Playwright also offers a CLI with SKILLS for coding agents:

**Pros:**
- More token-efficient (no large schemas)
- Direct code execution
- Better for high-throughput scenarios

**Cons:**
- Less state persistence
- Requires code generation expertise
- Less suitable for exploratory automation

**Recommendation:** Use MCP for OpenCode as it aligns better with agentic workflows that benefit from persistent state and iterative reasoning.

---

## 8. Known Limitations

1. **Accessibility Tree Gaps**: Some dynamic content may not appear in snapshots
2. **Geographic Restrictions**: Some sites block headless browsers
3. **CAPTCHA**: Cannot solve CAPTCHAs (by design)
4. **Complex Animations**: May require custom code execution
5. **Token Usage**: Large pages can generate substantial accessibility trees

### Mitigation Strategies

1. Use `browser_snapshot(depth=2)` to limit tree depth
2. Implement retry logic for flaky elements
3. Use `browser_run_code` for complex scenarios
4. Configure appropriate timeouts per operation type

---

## 9. Testing Strategy

### 9.1 Unit Tests

Test individual tool calls:
```typescript
// Test navigation
await test('navigate to URL', async () => {
  const result = await browser_navigate('https://example.com');
  expect(result.status).toBe('success');
});
```

### 9.2 Integration Tests

Test multi-step workflows:
```typescript
// Test form submission
await test('complete form workflow', async () => {
  await browser_navigate('https://example.com/form');
  await browser_fill_form({...});
  await browser_click('submit-button');
  const snapshot = await browser_snapshot();
  expect(snapshot).toContain('Success');
});
```

### 9.3 E2E Tests

Test real-world scenarios:
- Login workflows
- E-commerce checkout
- Data entry forms
- Search and navigation

---

## 10. Documentation Requirements

### 10.1 User Documentation

- Quick start guide
- Common workflow examples
- Troubleshooting guide
- Best practices

### 10.2 Developer Documentation

- Architecture overview
- Tool reference (all 40+ tools)
- Configuration options
- Extension patterns

### 10.3 API Documentation

- Tool schemas (input/output)
- Error codes and messages
- Rate limits and timeouts
- Version compatibility

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool Success Rate | > 95% | Successful tool executions / total attempts |
| Average Response Time | < 5s | Time from tool call to response |
| Token Efficiency | < 500 tokens/op | Average tokens per tool operation |
| Error Recovery Rate | > 90% | Successfully recovered from errors |
| User Satisfaction | > 4.5/5 | User feedback scores |

---

## 12. Appendix

### A. Complete Tool List

See: https://github.com/microsoft/playwright-mcp/blob/main/README.md#tools

### B. Configuration Reference

See: https://playwright.dev/docs/getting-started-mcp#configuration

### C. MCP Specification

See: https://modelcontextprotocol.io/specification/draft/server/tools.md

### D. Playwright Documentation

See: https://playwright.dev/docs/intro

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-09  
**Author:** MCP Builder Skill  
**Review Status:** Pending
