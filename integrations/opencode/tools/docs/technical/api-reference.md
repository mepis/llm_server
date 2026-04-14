# API Reference

Complete API endpoint reference with parameters, request/response formats, and error codes.

## Base URL

```
http://localhost:3000
```

## Authentication

No authentication required for basic usage. All endpoints use session-based authorization via `sessionId` in URL path.

## Response Format

All responses follow consistent format:

**Success Response:**

```json
{
  "success": true,
  "data": {
    /* operation result */
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "actionable error message",
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

## Session Endpoints

### Create Session

Create a new browser session.

**Endpoint:** `POST /sessions`

**Request Body:**

```json
{
  "browser": "chromium",
  "headless": true,
  "viewport": {
    "width": 1280,
    "height": 720
  }
}
```

| Field      | Type    | Default                    | Required |
| ---------- | ------- | -------------------------- | -------- |
| `browser`  | string  | "chromium"                 | No       |
| `headless` | boolean | true                       | No       |
| `viewport` | object  | {width: 1280, height: 720} | No       |

**Browser Values:** `chromium`, `firefox`, `webkit`

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "browser": "chromium",
    "contextId": null,
    "createdAt": 1712937600000,
    "lastUsedAt": 1712937600000,
    "status": "active",
    "options": {
      "headless": true,
      "viewport": { "width": 1280, "height": 720 },
      "userAgent": null
    }
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Browser launch failed
- `400` - Invalid viewport dimensions

### Get Session

Retrieve session information.

**Endpoint:** `GET /sessions/:id`

**Path Parameters:**

- `id` - Session UUID (required)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "browser": "chromium",
    "contextId": null,
    "createdAt": 1712937600000,
    "lastUsedAt": 1712937600000,
    "status": "active",
    "options": {
      "headless": true,
      "viewport": { "width": 1280, "height": 720 }
    }
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `404` - Session not found

### Delete Session

Close and delete a session.

**Endpoint:** `DELETE /sessions/:id`

**Path Parameters:**

- `id` - Session UUID (required)

**Response:** `204 No Content` (success) or error response

**Error Responses:**

- `404` - Session not found

## Navigation Endpoints

### Navigate

Navigate to a URL.

**Endpoint:** `POST /sessions/:id/navigate`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "url": "https://example.com",
  "waitUntil": "networkidle",
  "timeout": 30000
}
```

| Field       | Type   | Default       | Required |
| ----------- | ------ | ------------- | -------- |
| `url`       | string | -             | Yes      |
| `waitUntil` | string | "networkidle" | No       |
| `timeout`   | number | 30000         | No       |

**waitUntil Values:** `load`, `domcontentloaded`, `networkidle`, `commit`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://example.com"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Navigation failed, timeout, or invalid URL

### Back

Go back in browser history.

**Endpoint:** `POST /sessions/:id/back`

**Path Parameters:**

- `id` - Session UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://previous-page.com"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - No history to go back to

### Forward

Go forward in browser history.

**Endpoint:** `POST /sessions/:id/forward`

**Path Parameters:**

- `id` - Session UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://next-page.com"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - No history to go forward to

### Reload

Reload current page.

**Endpoint:** `POST /sessions/:id/reload`

**Path Parameters:**

- `id` - Session UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://current-page.com"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Reload failed

## Interaction Endpoints

### Click

Click a DOM element.

**Endpoint:** `POST /sessions/:id/click`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "selector": ".submit-button"
}
```

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `selector` | string | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/new-page"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Element not found or not visible

### Type

Type text into an input element.

**Endpoint:** `POST /sessions/:id/type`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "selector": "input[name='email']",
  "text": "user@example.com",
  "keyboard": true
}
```

| Field      | Type    | Default | Required |
| ---------- | ------- | ------- | -------- |
| `selector` | string  | -       | Yes      |
| `text`     | string  | -       | Yes      |
| `keyboard` | boolean | true    | No       |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/current-page"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Element not found, not visible, or timeout

## Extraction Endpoints

### Screenshot

Capture page screenshot.

**Endpoint:** `POST /sessions/:id/screenshot`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "fullPage": false,
  "type": "png",
  "quality": 100
}
```

| Field      | Type    | Default | Required |
| ---------- | ------- | ------- | -------- |
| `fullPage` | boolean | false   | No       |
| `type`     | string  | "png"   | No       |
| `quality`  | number  | 100     | No       |

**Response:** `200 OK` (binary image data)

Headers:

```
Content-Type: image/png
Content-Length: 12345
```

**Error Responses:**

- `500` - Screenshot failed

### Content

Get page HTML content.

**Endpoint:** `GET /sessions/:id/content`

**Path Parameters:**

- `id` - Session UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "content": "<!DOCTYPE html><html>...</html>"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Content extraction failed

### Text

Get page text content.

**Endpoint:** `GET /sessions/:id/text`

**Path Parameters:**

- `id` - Session UUID

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "text": "Welcome to Example\n\nThis is text content."
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Text extraction failed

### Attributes

Get element attributes.

**Endpoint:** `GET /sessions/:id/attributes/:selector`

**Path Parameters:**

- `id` - Session UUID
- `selector` - CSS selector (required)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "attributes": {
      "tagName": "INPUT",
      "className": "form-control",
      "id": "email",
      "innerText": "",
      "attributes": [
        { "name": "type", "value": "email" },
        { "name": "name", "value": "email" }
      ]
    }
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Element not found

### Evaluate

Execute JavaScript code.

**Endpoint:** `POST /sessions/:id/evaluate`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "code": "document.title"
}
```

| Field  | Type   | Required |
| ------ | ------ | -------- |
| `code` | string | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "result": "Example Domain",
    "type": "string",
    "code": "document.title"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - JavaScript execution error

### Add Init Script

Inject script on page load.

**Endpoint:** `POST /sessions/:id/add-init-script`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "code": "console.log('Init script')"
}
```

| Field  | Type   | Required |
| ------ | ------ | -------- |
| `code` | string | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Script injection failed

### Console Messages

Get console messages.

**Endpoint:** `GET /sessions/:id/console-messages`

**Path Parameters:**

- `id` - Session UUID

**Query Parameters:**

- `level` - Filter by level: log, info, warn, error (optional)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "timestamp": "2026-04-12T12:00:00.000Z",
        "level": "log",
        "text": "Page loaded",
        "args": [{ "type": "string", "value": "Page loaded" }]
      }
    ]
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Console capture failed

## Form Endpoints

### Fill Form

Fill form fields.

**Endpoint:** `POST /sessions/:id/fill-form`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "fields": {
    "username": "johndoe",
    "email": "john@example.com",
    "avatar.file": "/path/to/avatar.jpg"
  }
}
```

| Field    | Type   | Required |
| -------- | ------ | -------- |
| `fields` | object | Yes      |

**Field Naming:** Use `.file` suffix for file inputs (e.g., `avatar.file`)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "filled": 3
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Field not found or file not found

### Select Option

Select dropdown option(s).

**Endpoint:** `POST /sessions/:id/select-option`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "selector": "select[name='country']",
  "value": "US",
  "multiple": false
}
```

| Field      | Type          | Default | Required |
| ---------- | ------------- | ------- | -------- |
| `selector` | string        | -       | Yes      |
| `value`    | string\|array | -       | Yes      |
| `multiple` | boolean       | false   | No       |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "selected": "US"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Option not found or timeout

### Check

Check/uncheck checkbox or radio.

**Endpoint:** `POST /sessions/:id/check`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "selector": "input[name='terms']",
  "checked": true
}
```

| Field      | Type    | Default | Required |
| ---------- | ------- | ------- | -------- |
| `selector` | string  | -       | Yes      |
| `checked`  | boolean | true    | No       |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "checked": true
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Element not found

### Submit Form

Submit form.

**Endpoint:** `POST /sessions/:id/submit-form`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "selector": "form",
  "url": "https://example.com/success",
  "timeout": 10000
}
```

| Field      | Type   | Default | Required |
| ---------- | ------ | ------- | -------- |
| `selector` | string | "form"  | No       |
| `url`      | string | null    | No       |
| `timeout`  | number | 10000   | No       |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/success"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Submit failed or timeout

## Advanced Endpoints

### Wait For

Wait for condition.

**Endpoint:** `POST /sessions/:id/wait-for`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "condition": {
    "type": "selector",
    "selector": ".product-loaded",
    "state": "visible"
  },
  "timeout": 30000
}
```

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `condition` | object | Yes      |
| `timeout`   | number | No       |

**Condition Types:** `selector`, `networkidle`, `domcontentloaded`, `load`, `function`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "condition": "selector"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `408` - Timeout waiting for condition

### Set Viewport

Set viewport size.

**Endpoint:** `POST /sessions/:id/set-viewport`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "width": 1280,
  "height": 720,
  "device": "iPhone 12"
}
```

| Field    | Type   | Default | Required              |
| -------- | ------ | ------- | --------------------- |
| `width`  | number | -       | No (use device)       |
| `height` | number | -       | No (use device)       |
| `device` | string | null    | No (use width/height) |

**Device Values:** `iPhone 6`, `iPhone 12`, `iPad`, `Desktop`

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "viewport": { "width": 390, "height": 844 },
    "device": "iPhone 12"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `400` - Unknown device

### Set User Agent

Set user agent string.

**Endpoint:** `POST /sessions/:id/set-user-agent`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
}
```

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `userAgent` | string | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - User agent set failed

### Set Extra Headers

Set custom HTTP headers.

**Endpoint:** `POST /sessions/:id/set-extra-headers`

**Path Parameters:**

- `id` - Session UUID

**Request Body:**

```json
{
  "headers": {
    "X-Custom-Header": "custom-value",
    "Authorization": "Bearer token123"
  }
}
```

| Field     | Type   | Required |
| --------- | ------ | -------- |
| `headers` | object | Yes      |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "headers": {
      "X-Custom-Header": "custom-value"
    }
  },
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

**Error Responses:**

- `500` - Headers set failed

## Common Error Codes

| Code | Meaning           | Description                            |
| ---- | ----------------- | -------------------------------------- |
| 400  | Bad Request       | Invalid parameters, selector not found |
| 404  | Not Found         | Session does not exist                 |
| 408  | Timeout           | Operation timed out                    |
| 429  | Too Many Requests | Rate limit exceeded                    |
| 500  | Server Error      | Internal error, JavaScript error       |

## Rate Limiting

- **Limit:** 100 requests per 60 seconds per session
- **Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Response on limit:** 429 with `retryAfter: 60`

## Related Documentation

- [[features/session-management.md]] - Session operations
- [[features/navigation.md]] - Navigation operations
- [[features/interaction.md]] - Interaction operations
- [[architecture/overview.md]] - Architecture details

## Tags

`#api-reference` `#endpoints` `#parameters` `#responses` `#errors` `#rate-limiting` `#authentication`
