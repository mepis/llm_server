# Notes for LLM Assistance API

## Key Requirements from Instructions.md

1. **Application Purpose**: Provide an API that LLMs can use via tool calling to perform web research with Playwright
2. **Core Capabilities Needed**:
   - Web browsing via Playwright
   - Screenshot capture
   - Account authentication
   - Console message inspection
   - HTML/JS parsing
3. **Technical Stack**:
   - Runtime: Node.js v24.12.0+
   - Framework: Express.js
   - Browser Automation: Playwright (latest version)
   - Module System: CommonJS
4. **API Features**:
   - Mouse/keyboard interaction simulation
   - Markdown-native diagrams in documentation

## Playwright MCP Insights

From researching Playwright MCP (Model Context Protocol):
- Provides browser automation through structured accessibility snapshots
- Enables LLMs to interact with web pages without vision models
- Supports common browser interactions: navigation, clicking, typing, form filling
- Offers network monitoring and mocking capabilities
- Supports storage state (cookies, localStorage) persistence
- Can run in headed or headless mode
- Provides JavaScript execution capabilities through browser_run_code tool

## Express.js Agent API Patterns

From researching Express.js agent APIs:
- Need session management for tracking agent interactions
- Should support asynchronous task processing
- Requires proper error handling and logging
- Benefits from middleware composition for auth, rate limiting, etc.
- Should provide capabilities endpoint to list available tools
- Needs task status polling and streaming output options (SSE/WebSockets)

## Architecture Decisions

1. **Session-Based Design**: Each LLM agent gets isolated browser session
2. **RESTful API**: Simple, stateless endpoints for tool calling
3. **Direct Playwright Integration**: Rather than MCP proxy, direct API to Playwright for better control
4. **JSON Communication**: Standard JSON request/response format
5. **Error Standardization**: Consistent error responses with codes and messages

## Open Questions

1. Should we implement WebSocket/SSE for real-time updates or stick to polling?
2. How should we handle file downloads/uploads?
3. What level of network mocking/interception is needed?
4. Should we persist session data or keep everything in-memory?
5. What authentication mechanisms should we support for target websites?

## Next Steps

1. Implement basic Express.js server with session management
2. Create Playwright controller for browser operations
3. Build core navigation and interaction endpoints
4. Add data extraction and form handling capabilities
5. Implement security features and error handling
6. Add comprehensive testing and documentation