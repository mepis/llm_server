# OpenCode Playwright Tool - Design Document

## Overview

Create an OpenCode custom tool that exposes Playwright browser automation capabilities to the LLM. The tool enables browsing, interaction, debugging, and monitoring of web applications.

## Architecture

```
.opencode/tools/
├── playwright.ts          # Main tool definition (TypeScript)
├── playwright-core.js     # Playwright wrapper script (Node.js)
```

**Pattern**: Follow existing `search_the_web.ts` pattern - TypeScript tool definition invoking Node.js script.

## Dependencies

Add to `/home/jon/.config/opencode/package.json`:
```json
{
  "dependencies": {
    "@opencode-ai/plugin": "1.4.3",
    "playwright": "^1.40.0"
  }
}
```

Install: `npm install` in the config directory.

## Tool Definition (`playwright.ts`)

```typescript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Interact with web pages using Playwright browser automation",
  args: {
    action: tool.schema.enum([
      "launch",
      "navigate",
      "click",
      "fill",
      "screenshot",
      "html",
      "console",
      "evaluate",
      "close"
    ]).describe("Action to perform"),
    selector: tool.schema.string().optional().describe("CSS selector for element interaction"),
    value: tool.schema.string().optional().describe("Value for fill action or URL for navigate"),
    options: tool.schema.object({
      headless: tool.schema.boolean().default(true),
      fullPage: tool.schema.boolean().default(false),
      waitUntil: tool.schema.enum(["load", "domcontentloaded", "networkidle", "commit"]).default("networkidle")
    }).optional()
  },
  async execute(args, context) {
    const script = "/home/jon/.config/opencode/tools/playwright-core.js";
    const result = await Bun.$`node ${script} ${args.action} ${args.selector || ''} ${args.value || ''} ${JSON.stringify(args.options || {})}`.text();
    return result.trim();
  },
});
```

## Core Script (`playwright-core.js`)

Exposes key Playwright capabilities:

| Action | Parameters | Returns |
|--------|-----------|---------|
| `launch` | `{ headless?: boolean }` | Browser launched confirmation |
| `navigate` | `url`, `{ waitUntil }` | Page title and URL |
| `click` | `selector` | Click confirmation |
| `fill` | `selector`, `value` | Fill confirmation |
| `screenshot` | `{ fullPage?, path? }` | Base64 image or confirmation |
| `html` | - | Full page HTML |
| `console` | - | Array of console messages |
| `evaluate` | `script` | Script result |
| `close` | - | Close confirmation |

## Implementation Details

1. **State Management**: Use a simple in-memory store (or file-based) for browser context since each tool call is stateless
2. **Error Handling**: Return structured JSON with success/error status
3. **Screenshots**: Save to `/tmp/playwright-*.png` and return path, or return base64
4. **Console Logs**: Capture `console.log`, `warn`, `error` during page lifecycle

## Usage Examples

```
playwright: { action: "launch", options: { headless: true } }
playwright: { action: "navigate", value: "http://localhost:5173", options: { waitUntil: "networkidle" } }
playwright: { action: "click", selector: "#submit-btn" }
playwright: { action: "screenshot", options: { fullPage: true } }
playwright: { action: "console" }
playwright: { action: "html" }
playwright: { action: "close" }
```

## Future Enhancements (Post-MVP)

- Multi-browser support (chromium, firefox, webkit)
- Network request interception
- Element state inspection (visible, enabled, etc.)
- Cookie/session management
- File upload handling

## Files to Create

1. `opencode_tool/playwright.ts` - Tool definition
2. `opencode_tool/playwright-core.js` - Implementation
3. Update `opencode_tool/package.json` - Add playwright dependency