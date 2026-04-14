# LLM Assistance API

Express.js API for LLM web research via Playwright browser automation.

## Features

- **Browser Automation**: Full control over Chromium, Firefox, and WebKit browsers
- **Session Management**: Isolated browser sessions with automatic cleanup
- **Navigation & Interaction**: Navigate URLs, click elements, type text
- **Data Extraction**: Extract HTML, text, screenshots, and execute JavaScript
- **Form Handling**: Fill forms, select options, submit forms
- **Advanced Features**: Viewport control, user agent emulation, wait conditions
- **LLM-Friendly**: Designed for tool-calling patterns with actionable error messages

## Quick Start

### Installation

```bash
npm install
npx playwright install chromium
```

### Running Locally

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Docker

```bash
docker build -t llm-assistance-api .
docker run -p 3000:3000 llm-assistance-api
```

## API Documentation

Interactive Swagger UI available at: http://localhost:3000/docs

## Example Usage

```javascript
// Create a session
const session = await fetch("http://localhost:3000/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ browser: "chromium" }),
});

const sessionId = session.data.id;

// Navigate to a page
await fetch(`http://localhost:3000/sessions/${sessionId}/navigate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://example.com" }),
});

// Extract content
const content = await fetch(
  `http://localhost:3000/sessions/${sessionId}/content`,
);
const html = await content.json();

// Clean up
await fetch(`http://localhost:3000/sessions/${sessionId}`, {
  method: "DELETE",
});
```

## Environment Variables

| Variable         | Default  | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `PORT`           | 3000     | Server port                            |
| `BROWSER`        | chromium | Browser type (chromium/firefox/webkit) |
| `HEADLESS`       | true     | Run browser headless                   |
| `CORS_ORIGIN`    | \*       | CORS allowed origins                   |
| `RATE_LIMIT_MAX` | 100      | Requests per window                    |

## API Endpoints

### Session Management

- `POST /sessions` - Create session
- `GET /sessions/:id` - Get session info
- `DELETE /sessions/:id` - Delete session

### Navigation & Interaction

- `POST /sessions/:id/navigate` - Navigate to URL
- `POST /sessions/:id/click` - Click element
- `POST /sessions/:id/type` - Type text

### Data Extraction

- `GET /sessions/:id/content` - Get HTML content
- `GET /sessions/:id/text` - Get visible text
- `POST /sessions/:id/screenshot` - Capture screenshot
- `POST /sessions/:id/evaluate` - Execute JavaScript

### Form Handling

- `POST /sessions/:id/fill-form` - Fill form fields
- `POST /sessions/:id/submit-form` - Submit form

### Advanced Features

- `POST /sessions/:id/wait-for` - Wait for condition
- `POST /sessions/:id/set-viewport` - Set viewport size
- `POST /sessions/:id/set-user-agent` - Set user agent

## Testing

```bash
npm test
npm run test:coverage
```

## License

MIT
