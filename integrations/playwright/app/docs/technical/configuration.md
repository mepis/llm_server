# Configuration

Environment variables, settings, and deployment configuration for the LLM Assistance API.

## Environment Variables

All configuration is managed through environment variables. Set these before starting the server.

### Required Variables

None - all variables have sensible defaults.

### Optional Variables

| Variable      | Default  | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `PORT`        | 3000     | Server listening port                                   |
| `BROWSER`     | chromium | Default browser type for new sessions                   |
| `HEADLESS`    | true     | Default headless mode for new sessions                  |
| `CORS_ORIGIN` | \*       | Allowed CORS origins (use comma-separated for multiple) |

### Environment Variable Examples

**Development:**

```bash
PORT=3000
BROWSER=chromium
HEADLESS=true
CORS_ORIGIN=*
```

**Production:**

```bash
PORT=8080
BROWSER=chromium
HEADLESS=true
CORS_ORIGIN=https://yourdomain.com
```

### Setting Environment Variables

**Linux/macOS:**

```bash
export PORT=3000
export BROWSER=chromium
npm run dev
```

**Windows (Command Prompt):**

```cmd
set PORT=3000
set BROWSER=chromium
npm run dev
```

**Windows (PowerShell):**

```powershell
$env:PORT="3000"
$env:BROWSER="chromium"
npm run dev
```

**.env File:**

```bash
# Create .env file in project root
PORT=3000
BROWSER=chromium
HEADLESS=true
CORS_ORIGIN=*
```

## Server Configuration

### Starting the Server

**Development Mode (with auto-reload):**

```bash
npm run dev
```

**Production Mode:**

```bash
npm start
```

**Using nodemon directly:**

```bash
npx nodemon src/index.js
```

**Custom port:**

```bash
PORT=8080 npm run dev
```

### Server Behavior

| Setting       | Effect                                                 |
| ------------- | ------------------------------------------------------ |
| `PORT`        | Determines which port the server listens on            |
| `BROWSER`     | Sets default browser for new sessions if not specified |
| `HEADLESS`    | Sets default headless mode for new sessions            |
| `CORS_ORIGIN` | Controls which origins can make requests               |

## Browser Configuration

### Browser Types

The API supports three browser engines:

| Browser    | Use Case                    | Installation                      |
| ---------- | --------------------------- | --------------------------------- |
| `chromium` | Default, best compatibility | `npx playwright install chromium` |
| `firefox`  | Firefox-specific testing    | `npx playwright install firefox`  |
| `webkit`   | Safari/Safari-like testing  | `npx playwright install webkit`   |

### Browser Installation

**Install all browsers:**

```bash
npx playwright install
```

**Install specific browser:**

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

**Install for system user:**

```bash
npx playwright install --system
```

### Browser Launch Options

Browser options can be set per-session or via environment variable:

**Per-session (in POST /sessions request):**

```json
{
  "browser": "firefox",
  "headless": false,
  "viewport": { "width": 1920, "height": 1080 }
}
```

**Environment variable (default for all sessions):**

```bash
BROWSER=firefox
HEADLESS=false
```

## Viewport Configuration

### Default Viewport

The default viewport is `1280x720`. Set per-session or use predefined devices.

**Per-session:**

```json
{
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

### Predefined Devices

Use device presets for common screen sizes:

| Device      | Width | Height | Use Case        |
| ----------- | ----- | ------ | --------------- |
| `iPhone 6`  | 375   | 667    | Mobile testing  |
| `iPhone 12` | 390   | 844    | Modern mobile   |
| `iPad`      | 768   | 1024   | Tablet testing  |
| `Desktop`   | 1920  | 1080   | Desktop testing |

**Usage:**

```bash
curl -X POST http://localhost:3000/sessions/SESSION_ID/set-viewport \
  -d '{"device": "iPhone 12"}'
```

## Timeout Configuration

### Default Timeouts

| Operation          | Default Timeout |
| ------------------ | --------------- |
| Navigation         | 30 seconds      |
| Type operation     | 5 seconds       |
| Select option      | 5 seconds       |
| Submit form        | 5 seconds       |
| Wait for condition | 30 seconds      |

### Custom Timeouts

Timeouts can be specified per-operation:

```json
{
  "url": "https://slow-page.com",
  "timeout": 60000
}
```

## Rate Limiting Configuration

### Default Settings

| Setting       | Value           |
| ------------- | --------------- |
| Window        | 60 seconds      |
| Max requests  | 100 per session |
| Key generator | Session ID      |

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**Response Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712937660
```

## CORS Configuration

### Default Setting

By default, CORS allows all origins (`*`).

**Production recommendation:** Specify allowed origins

```bash
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
```

### CORS Methods

Allowed HTTP methods: `GET`, `POST`, `DELETE`

### CORS Headers

Exposed headers in responses:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Security Configuration

### Security Headers

The API automatically sets these security headers on all responses:

| Header                              | Value           | Purpose                |
| ----------------------------------- | --------------- | ---------------------- |
| `X-Content-Type-Options`            | `nosniff`       | Prevent MIME sniffing  |
| `X-Frame-Options`                   | `SAMEORIGIN`    | Prevent clickjacking   |
| `X-XSS-Protection`                  | `1; mode=block` | Enable XSS filter      |
| `X-Permitted-Cross-Domain-Policies` | `master`        | Control Adobe products |

### Input Validation

All inputs are validated before processing:

- Session ID format (UUID)
- Selector validity
- URL format
- JSON structure

## Logging Configuration

### Request Logging

All requests are logged with timestamp, method, and path:

```
[2026-04-12T12:00:00.000Z] POST /sessions/:id/navigate
```

### Error Logging

Errors are logged with full stack trace:

```javascript
console.error(err);
```

### Console Message Capture

Page console messages can be captured via API:

```bash
curl http://localhost:3000/sessions/SESSION_ID/console-messages
```

## Deployment Configuration

### Docker Deployment

**Build image:**

```bash
docker build -t llm-assistance-api .
```

**Run container:**

```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e BROWSER=chromium \
  -e HEADLESS=true \
  llm-assistance-api
```

**Run with custom environment:**

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e CORS_ORIGIN=https://yourdomain.com \
  llm-assistance-api
```

### Docker Compose

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - BROWSER=chromium
      - HEADLESS=true
      - CORS_ORIGIN=*
    restart: unless-stopped
```

### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with environment variables
pm2 start src/index.js --name "llm-api" \
  --env PORT=3000 \
  --env BROWSER=chromium

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

## Health Check

Check if server is running:

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{ "status": "ok" }
```

## Development vs Production

### Development Mode

- Auto-reload on file changes (nodemon)
- Verbose logging
- All CORS origins allowed
- Default browser: chromium
- Headless mode: true

### Production Mode

- No auto-reload
- Optimized logging
- Restricted CORS
- Use environment variables for configuration
- Enable monitoring

## Configuration Validation

### Validate Configuration

Before deployment, verify:

1. **Playwright browsers installed:**

   ```bash
   npx playwright install --dry-run
   ```

2. **Port available:**

   ```bash
   lsof -i :3000
   ```

3. **Environment variables set:**

   ```bash
   echo $PORT
   echo $BROWSER
   ```

4. **Server starts successfully:**
   ```bash
   npm start
   curl http://localhost:3000/health
   ```

## Troubleshooting

### Common Configuration Issues

**Browser not found:**

```bash
# Install browser
npx playwright install chromium
```

**Port already in use:**

```bash
# Change port
PORT=8080 npm start
```

**CORS errors:**

```bash
# Set proper origin
CORS_ORIGIN=https://yourapp.com npm start
```

**Headless mode issues:**

```bash
# Enable visible browser
HEADLESS=false npm start
```

## Related Documentation

- [[architecture/overview.md]] - System architecture
- [[technical/security.md]] - Security features
- [[technical/api-reference.md]] - API endpoints

## Tags

`#configuration` `#environment-variables` `#deployment` `#settings` `#browser-config` `#port` `#cors` `#timeout` `#rate-limiting`
