# Architecture Overview

Deep dive into the LLM Assistance API architecture. Understand system components, data flow, and design decisions.

## System Architecture

The LLM Assistance API is a layered architecture built on Express.js with Playwright for browser automation. The system follows a session-based model where each operation occurs within an isolated browser context.

### High-Level Architecture

```mermaid
graph TD
    A[LLM Agent] -->|HTTP Requests| B[API Gateway]
    B --> C[Express Server]
    C --> D[Router Layer]
    D --> E[Controller Layer]
    E --> F[Service Layer]
    F --> G[Playwright Controller]
    G --> H[Browser Engine]

    C -.-> I[Session Storage]
    F -.-> I
    E -.-> J[Response Formatter]
    J -.-> C
```

### Component Layers

| Layer           | Responsibility                          | Components           |
| --------------- | --------------------------------------- | -------------------- |
| **API Gateway** | Request routing, CORS, security headers | Express middleware   |
| **Router**      | Route definition, rate limiting         | Route handlers       |
| **Controller**  | Request parsing, response formatting    | Controller functions |
| **Service**     | Business logic, session management      | PlaywrightService    |
| **Browser**     | Browser automation                      | PlaywrightController |
| **Storage**     | Session state persistence               | SessionStorage       |

## Component Details

### Express Server

**Location:** `src/index.js`

**Responsibilities:**

- HTTP request handling
- Middleware configuration
- Route registration
- Error handling
- Server lifecycle management

**Key Configuration:**

```javascript
// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Rate limiting
const sessionLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  keyGenerator: (req) => req.params.id || "global",
});

// Security headers
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
  });
  next();
});
```

### Session Storage

**Location:** `src/services/session/SessionStorage.js`

**Responsibilities:**

- Session lifecycle management
- In-memory session state
- Session metadata tracking
- Cleanup operations

**Data Model:**

```mermaid
classDiagram
    class SessionStorage {
        +Map sessions
        +createSession(options) Session
        +getSession(id) Session
        +deleteSession(id) boolean
        +getAllSessions() Session[]
        +cleanupInactiveSessions(timeoutMs) void
    }

    class Session {
        +string id
        +string browser
        +string contextId
        +number createdAt
        +number lastUsedAt
        +string status
        +SessionOptions options
        +BrowserController controller
        +BrowserContext context
        +Page page
    }

    class SessionOptions {
        +boolean headless
        +Viewport viewport
        +string userAgent
    }

    SessionStorage --> Session
    Session --> SessionOptions
```

### Playwright Service

**Location:** `src/services/session/PlaywrightService.js`

**Responsibilities:**

- Browser lifecycle coordination
- Context and page creation
- Session-object attachment
- Resource cleanup

**Flow:**

```mermaid
sequenceDiagram
    participant PS as PlaywrightService
    participant SS as SessionStorage
    participant PC as PlaywrightController
    participant B as Browser

    PS->>SS: createSession(options)
    SS-->>PS: sessionData

    PS->>PC: launch()
    PC->>B: launchBrowser()
    B-->>PC: browserInstance

    PS->>PC: createContext()
    PC->>B: newContext()
    B-->>PC: context

    PS->>PC: createPage()
    PC->>B: newPage()
    B-->>PC: page

    PS->>SS: attach live objects
    SS-->>PS: session with browser objects
```

### Playwright Controller

**Location:** `src/controllers/playwright/PlaywrightController.js`

**Responsibilities:**

- Browser type selection (chromium, firefox, webkit)
- Browser instance management
- Context configuration
- Page creation
- Resource cleanup

**Browser Support:**

```mermaid
flowchart LR
    A[PlaywrightController] --> B[chromium]
    A --> C[firefox]
    A --> D[webkit]

    B --> E[Chromium Browser]
    C --> F[Firefox Browser]
    D --> G[WebKit Browser]
```

### Controllers

Each controller handles a specific domain of operations:

| Controller              | Location                                               | Operations                                      |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `sessionController`     | `src/controllers/sessionController.js`                 | Create, get, delete sessions                    |
| `navigationController`  | `src/controllers/navigation/NavigationController.js`   | Navigate, back, forward, reload                 |
| `interactionController` | `src/controllers/interaction/InteractionController.js` | Click, type                                     |
| `extractionController`  | `src/controllers/extraction/ExtractionController.js`   | Screenshot, content, text, attributes, evaluate |
| `formController`        | `src/controllers/form/FormController.js`               | Fill form, select option, check, submit         |
| `advancedController`    | `src/controllers/advanced/AdvancedController.js`       | Wait for, set viewport, user agent, headers     |

## Data Flow

### Request Processing Flow

```mermaid
sequenceDiagram
    participant LLM as LLM Agent
    participant API as API Server
    participant Router as Router
    participant Ctrl as Controller
    participant Service as Service
    participant Storage as SessionStorage
    participant Playwright as Playwright

    LLM->>API: POST /sessions/:id/navigate

    API->>Router: Route matching + rate limit
    Router->>Ctrl: navigationController.navigate

    Ctrl->>Storage: getSession(id)
    Storage-->>Ctrl: session object

    Ctrl->>Service: (direct page access)
    Service->>Playwright: page.goto(url)
    Playwright-->>Service: navigation complete

    Service-->>Ctrl: success
    Ctrl->>API: sendResponse

    API-->>LLM: {success: true, data: {...}}
```

### Response Format Flow

```mermaid
flowchart TD
    A[Operation Result] --> B{Success?}
    B -->|Yes| C[Create Success Response]
    B -->|No| D[Create Error Response]

    C --> E[Add timestamp]
    D --> E

    E --> F[JSON Response]
    F --> G[Set HTTP Status]
    G --> H[Send to Client]
```

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

## Session Architecture

### Session Isolation

Each session provides complete isolation:

```mermaid
graph TD
    A[Session 1] --> B1[Browser Context 1]
    A --> P1[Page 1]

    C[Session 2] --> B2[Browser Context 2]
    C --> P2[Page 2]

    D[Session 3] --> B3[Browser Context 3]
    D --> P3[Page 3]

    B1 -.->|Isolated| B2
    B2 -.->|Isolated| B3
    B3 -.->|Isolated| B1

    P1 -.->|No sharing| P2
    P2 -.->|No sharing| P3
```

**Isolation Properties:**

- Separate cookie storage
- Independent DOM state
- Isolated JavaScript execution
- No shared localStorage/sessionStorage
- Independent network requests

### Session State Machine

```mermaid
stateDiagram-v2
    [*] --> Creating: POST /sessions
    Creating --> Active: Browser initialized
    Active --> Used: Any operation
    Used --> Active: Operation complete
    Active --> Deleting: DELETE /sessions/:id
    Deleting --> Closed: Resources freed
    Closed --> [*]

    Active --> Error: Operation fails
    Error --> Active: Recovery possible
    Error --> Closed: Unrecoverable error
```

## Error Handling Architecture

### Error Propagation

```mermaid
flowchart TD
    A[Operation Error] --> B[Controller Catch]
    B --> C[Create Error Response]
    C --> D[Log Error]
    D --> E[Send Response]

    F[Unhandled Error] --> G[Error Middleware]
    G --> H[Log Error]
    H --> I[500 Response]
```

**Error Response Structure:**

| Component        | Purpose                           |
| ---------------- | --------------------------------- |
| `success: false` | Programmatic error detection      |
| `error`          | Human-readable actionable message |
| `timestamp`      | Debug and tracking                |
| HTTP status      | Standard error categorization     |

### Error Categories

| Status Code | Category     | Example                             |
| ----------- | ------------ | ----------------------------------- |
| 400         | Bad Request  | Invalid selector, missing parameter |
| 404         | Not Found    | Session not found                   |
| 408         | Timeout      | Wait condition timeout              |
| 429         | Rate Limit   | Too many requests                   |
| 500         | Server Error | JavaScript execution error          |

## Security Architecture

### Security Layers

```mermaid
graph TD
    A[Request] --> B[CORS Check]
    B --> C[Rate Limiting]
    C --> D[Input Validation]
    D --> E[Session Validation]
    E --> F[Operation Execution]

    G[Security Headers] -.-> H[Every Response]
```

**Security Measures:**

| Layer                  | Implementation                                |
| ---------------------- | --------------------------------------------- |
| **CORS**               | Configurable origin whitelist                 |
| **Rate Limiting**      | 100 requests per 60 seconds per session       |
| **Input Sanitization** | Validation before operation                   |
| **Session Isolation**  | Complete context separation                   |
| **Security Headers**   | X-Frame-Options, X-Content-Type-Options, etc. |

### Rate Limiting Strategy

```mermaid
flowchart LR
    A[Request] --> B{Rate Limit Check}
    B -->|Under limit| C[Allow Request]
    B -->|Over limit| D[429 Response]

    E[60s Window] --> F[Reset Counter]
    C --> G[Increment Counter]
```

**Rate Limit Configuration:**

- Window: 60 seconds
- Max requests: 100 per session
- Key generator: Session ID or global fallback
- Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

## Performance Architecture

### Resource Management

```mermaid
flowchart TD
    A[Session Created] --> B[Browser Launched]
    B --> C[Context Created]
    C --> D[Page Created]

    E[Session Deleted] --> F[Page Closed]
    F --> G[Context Closed]
    G --> H[Browser Closed]
```

**Resource Cleanup:**

- Page closed on session deletion
- Context closed after page
- Browser closed after context
- Automatic error handling cleanup

### Concurrency Model

- Each session runs in isolated browser context
- Multiple sessions can run concurrently
- Browser instances are shared within same type
- Memory usage scales with concurrent sessions

## Technology Stack

| Component              | Technology               | Purpose                 |
| ---------------------- | ------------------------ | ----------------------- |
| **Server**             | Express.js 5.2.1         | HTTP server and routing |
| **Browser Automation** | Playwright 1.59.1        | Browser control         |
| **Session Storage**    | In-memory Map            | Session state           |
| **Rate Limiting**      | express-rate-limit 8.3.2 | Request throttling      |
| **CORS**               | cors 2.8.6               | Cross-origin requests   |
| **Documentation**      | swagger-ui-express 5.0.1 | API documentation       |
| **UUID Generation**    | uuid 9.0.1               | Session IDs             |

## File Structure

```
src/
├── index.js                    # Entry point
├── controllers/
│   ├── playwright/
│   │   └── PlaywrightController.js
│   ├── sessionController.js
│   ├── navigation/
│   │   └── NavigationController.js
│   ├── interaction/
│   │   └── InteractionController.js
│   ├── extraction/
│   │   └── ExtractionController.js
│   ├── form/
│   │   └── FormController.js
│   └── advanced/
│       └── AdvancedController.js
├── services/
│   └── session/
│       ├── SessionStorage.js
│       └── PlaywrightService.js
├── utils/
│   ├── response.js
│   └── sanitizer.js
├── tests/
│   ├── server.test.js
│   ├── session.test.js
│   ├── session_controller.test.js
│   ├── playwright_controller.test.js
│   ├── navigation.test.js
│   ├── interaction.test.js
│   ├── extraction.test.js
│   ├── form.test.js
│   ├── advanced.test.js
│   └── javascript.test.js
└── docs/
    ├── openapi.js              # OpenAPI specification
    └── examples/
        └── workflow-examples.js
```

## Deployment Architecture

### Docker Deployment

```mermaid
graph TD
    A[Docker Image] --> B[Container]
    B --> C[Express Process]
    C --> D[Playwright Browser]

    E[Port Mapping] --> F[3000:3000]
    F --> C

    G[Environment Variables] --> H[Configuration]
    H --> C
```

**Docker Configuration:**

- Base image: Node.js 24
- Port: 3000
- Environment variables for configuration
- Playwright browsers included in image

### Environment Configuration

| Variable      | Default  | Description          |
| ------------- | -------- | -------------------- |
| `PORT`        | 3000     | Server port          |
| `BROWSER`     | chromium | Default browser type |
| `HEADLESS`    | true     | Headless mode        |
| `CORS_ORIGIN` | \*       | Allowed CORS origins |

## Scalability Considerations

### Current Limitations

- **In-memory storage**: Sessions lost on restart
- **Single instance**: No horizontal scaling
- **Browser resources**: Memory intensive per session

### Future Enhancements

| Enhancement        | Benefit                         | Complexity |
| ------------------ | ------------------------------- | ---------- |
| Redis storage      | Persistence, horizontal scaling | Medium     |
| Multiple instances | Increased capacity              | High       |
| Browser pooling    | Resource efficiency             | High       |
| Queue system       | Request management              | Medium     |

## Monitoring and Observability

### Logging

```mermaid
flowchart TD
    A[Request Received] --> B[Log timestamp + method + path]
    B --> C[Operation Execution]
    C --> D{Error?}
    D -->|Yes| E[Log error + stack]
    D -->|No| F[Log success]
```

**Log Format:**

```
[2026-04-12T12:00:00.000Z] POST /sessions/:id/navigate
```

### Metrics to Track

- Active session count
- Request latency per endpoint
- Error rates by type
- Browser crash detection
- Rate limit hits

## Related Documentation

- [[features/session-management.md]] - Session operations
- [[technical/configuration.md]] - Environment settings
- [[technical/security.md]] - Security implementation
- [Design Document](../design_documents/design.md) - Original design specification

## Tags

`#architecture` `#system-design` `#components` `#data-flow` `#session-management` `#security` `#performance` `#scalability` `#technology-stack`
