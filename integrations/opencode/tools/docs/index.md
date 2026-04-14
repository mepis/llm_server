# LLM Assistance API Documentation

Welcome to the LLM Assistance API documentation. This API enables Large Language Models to interact with web pages through Playwright automation via tool calling.

## Quick Start

```bash
# Install Playwright browsers (required)
npx playwright install chromium

# Start server
npm run dev

# Access API docs
http://localhost:3000/docs
```

## Core Concepts

### Session-Based Architecture

All operations work within sessions. Each session represents an isolated browser context.

1. **Create Session** - `POST /sessions` returns a `sessionId`
2. **Use Session** - Include `sessionId` in all subsequent requests
3. **Delete Session** - `DELETE /sessions/:id` to clean up resources

### Response Format

All responses follow this pattern for easy LLM parsing:

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "actionable error message",
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

## Documentation Index

### Feature Documentation

| Document                                                   | Description                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Session Management](./features/session-management.md)     | Create, retrieve, and delete browser sessions with configuration options |
| [Navigation](./features/navigation.md)                     | Navigate to URLs, go back/forward, reload pages                          |
| [Interaction](./features/interaction.md)                   | Click elements and type text into input fields                           |
| [Data Extraction](./features/extraction.md)                | Capture screenshots and extract page content (HTML, text, attributes)    |
| [Form Handling](./features/form-handling.md)               | Fill forms, select options, check checkboxes, submit forms               |
| [Advanced Features](./features/advanced-features.md)       | Wait for conditions, set viewport, configure user agent and headers      |
| [JavaScript Execution](./features/javascript-execution.md) | Execute custom JavaScript and capture console messages                   |

### Technical Documentation

| Document                                            | Description                                          |
| --------------------------------------------------- | ---------------------------------------------------- |
| [Architecture Overview](./architecture/overview.md) | System architecture, component diagrams, data flow   |
| [API Reference](./technical/api-reference.md)       | Complete API endpoint reference with parameters      |
| [Configuration](./technical/configuration.md)       | Environment variables and configuration options      |
| [Security](./technical/security.md)                 | Security features, rate limiting, input sanitization |

### QA Documentation

| Document                                   | Description                                 |
| ------------------------------------------ | ------------------------------------------- |
| [Basic Workflows](./qa/basic-workflows.md) | Common workflows with step-by-step examples |
| [Research Task](./qa/research-task.md)     | Complete web research task example          |
| [Form Submission](./qa/form-submission.md) | Multi-step form filling and submission      |

## Feature Categories

Use the [Tags Index](./tags/index.md) for a complete tag-based navigation organized by feature categories.

## Common Patterns

### Research Workflow

```
1. POST /sessions → Get sessionId
2. POST /sessions/:id/navigate → Go to target URL
3. POST /sessions/:id/screenshot → Capture page state
4. GET /sessions/:id/content → Extract HTML
5. POST /sessions/:id/evaluate → Run custom analysis
6. DELETE /sessions/:id → Clean up
```

### Error Recovery

When `success: false` appears in response:

1. Read the `error` message for actionable information
2. Adjust parameters based on error description
3. Retry with corrected values
4. Check rate limits if receiving 429 status

## Tags

Browse documentation by tags using [[tags/index.md]].

## Related Resources

- [API Documentation](http://localhost:3000/docs) - Interactive Swagger UI
- [Design Document](../design_documents/design.md) - System design details
- [Sprint Plan](../design_documents/sprint_plan.md) - Development roadmap
