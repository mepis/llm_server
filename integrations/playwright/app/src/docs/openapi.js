const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "LLM Assistance API",
    version: "1.0.0",
    description:
      "API for LLMs to interact with web pages via Playwright browser automation. Enables navigation, interaction, data extraction, and form handling through tool-calling patterns.",
    contact: {
      name: "API Support",
      url: "https://github.com/anomalyco/opencode/issues",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Session Management",
      description: "Create, retrieve, and delete browser sessions",
    },
    {
      name: "Navigation",
      description: "Navigate through web pages",
    },
    {
      name: "Interaction",
      description: "Interact with page elements",
    },
    {
      name: "Data Extraction",
      description: "Extract content, screenshots, and data from pages",
    },
    {
      name: "Form Handling",
      description: "Fill forms, select options, and submit",
    },
    {
      name: "Advanced Features",
      description: "Wait conditions, viewport, and user agent manipulation",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Session Management"],
        summary: "Health check endpoint",
        description: "Verify API is running and responsive",
        responses: {
          200: {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions": {
      post: {
        tags: ["Session Management"],
        summary: "Create a new browser session",
        description:
          "Creates an isolated browser session for LLM to perform web research. Session includes Chromium/Firefox/WebKit browser with configurable options.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  browser: {
                    type: "string",
                    enum: ["chromium", "firefox", "webkit"],
                    default: "chromium",
                    description: "Browser type to use",
                  },
                  headless: {
                    type: "boolean",
                    default: true,
                    description: "Run browser in headless mode",
                  },
                  viewport: {
                    type: "object",
                    properties: {
                      width: {
                        type: "integer",
                        default: 1280,
                        description: "Viewport width in pixels",
                      },
                      height: {
                        type: "integer",
                        default: 720,
                        description: "Viewport height in pixels",
                      },
                    },
                  },
                },
              },
              examples: {
                default: {
                  summary: "Default session",
                  value: {
                    browser: "chromium",
                    headless: true,
                    viewport: { width: 1280, height: 720 },
                  },
                },
                firefox: {
                  summary: "Firefox session",
                  value: {
                    browser: "firefox",
                    headless: false,
                    viewport: { width: 1920, height: 1080 },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Session created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          description:
                            "Session identifier for subsequent calls",
                        },
                        browser: { type: "string" },
                        status: { type: "string" },
                        options: {
                          type: "object",
                          properties: {
                            headless: { type: "boolean" },
                            viewport: {
                              type: "object",
                              properties: {
                                width: { type: "integer" },
                                height: { type: "integer" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                examples: {
                  default: {
                    value: {
                      success: true,
                      data: {
                        id: "550e8400-e29b-41d4-a716-446655440000",
                        browser: "chromium",
                        status: "active",
                        options: {
                          headless: true,
                          viewport: { width: 1280, height: 720 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "Failed to create session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}": {
      get: {
        tags: ["Session Management"],
        summary: "Retrieve session information",
        description:
          "Get details about an existing browser session including status and configuration.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Session retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        browser: { type: "string" },
                        status: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Session not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Session Management"],
        summary: "Delete a browser session",
        description:
          "Closes the browser and removes the session. Releases browser resources.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          204: {
            description: "Session deleted successfully",
          },
          404: {
            description: "Session not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/navigate": {
      post: {
        tags: ["Navigation"],
        summary: "Navigate to a URL",
        description:
          "Navigate the browser to a specified URL. Waits for page load before returning.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    description: "URL to navigate to",
                  },
                  waitUntil: {
                    type: "string",
                    enum: ["load", "domcontentloaded", "networkidle", "commit"],
                    default: "networkidle",
                    description: "Event to wait for on navigation",
                  },
                  timeout: {
                    type: "integer",
                    default: 30000,
                    description: "Navigation timeout in milliseconds",
                  },
                },
              },
              examples: {
                default: {
                  summary: "Navigate to homepage",
                  value: {
                    url: "https://example.com",
                    waitUntil: "networkidle",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Navigation successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          format: "uri",
                          description: "Current page URL after navigation",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Navigation failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/back": {
      post: {
        tags: ["Navigation"],
        summary: "Go back in history",
        description: "Navigate to the previous page in browser history.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Navigation successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/forward": {
      post: {
        tags: ["Navigation"],
        summary: "Go forward in history",
        description: "Navigate to the next page in browser history.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Navigation successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/reload": {
      post: {
        tags: ["Navigation"],
        summary: "Reload current page",
        description: "Reload the current page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Reload successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/click": {
      post: {
        tags: ["Interaction"],
        summary: "Click an element",
        description:
          "Click on a DOM element identified by CSS selector. Waits for element to be visible.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["selector"],
                properties: {
                  selector: {
                    type: "string",
                    description: "CSS selector for the element to click",
                    example: "#submit-button",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Click successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Click failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                    selector: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/type": {
      post: {
        tags: ["Interaction"],
        summary: "Type text into an element",
        description:
          "Type text into a form field with simulated keystroke delays. Simulates human typing behavior.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["selector", "text"],
                properties: {
                  selector: {
                    type: "string",
                    description: "CSS selector for the input element",
                  },
                  text: {
                    type: "string",
                    description: "Text to type",
                  },
                  keyboard: {
                    type: "boolean",
                    default: true,
                    description: "Use keyboard typing simulation",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Text typed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/screenshot": {
      post: {
        tags: ["Data Extraction"],
        summary: "Capture screenshot",
        description:
          "Capture a screenshot of the current page. Returns binary image data.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullPage: {
                    type: "boolean",
                    default: false,
                    description: "Capture full page or viewport only",
                  },
                  type: {
                    type: "string",
                    enum: ["png", "jpeg"],
                    default: "png",
                    description: "Image format",
                  },
                  quality: {
                    type: "integer",
                    default: 100,
                    minimum: 0,
                    maximum: 100,
                    description: "Quality for JPEG images (0-100)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Screenshot captured",
            content: {
              "image/png": {
                schema: { type: "string", format: "binary" },
              },
              "image/jpeg": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/content": {
      get: {
        tags: ["Data Extraction"],
        summary: "Get page HTML content",
        description: "Retrieve the full HTML content of the current page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Content retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        content: {
                          type: "string",
                          description: "Full HTML content of the page",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/text": {
      get: {
        tags: ["Data Extraction"],
        summary: "Get page text content",
        description: "Extract all visible text from the current page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        responses: {
          200: {
            description: "Text extracted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        text: {
                          type: "string",
                          description: "All visible text content from the page",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/attributes/{selector}": {
      get: {
        tags: ["Data Extraction"],
        summary: "Get element attributes",
        description:
          "Retrieve attributes (tagName, className, id, innerText, all attributes) for a specific element.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
          {
            name: "selector",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "CSS selector for the element",
          },
        ],
        responses: {
          200: {
            description: "Attributes retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        attributes: {
                          type: "object",
                          properties: {
                            tagName: { type: "string" },
                            className: { type: "string" },
                            id: { type: "string" },
                            innerText: { type: "string" },
                            attributes: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  value: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/evaluate": {
      post: {
        tags: ["Data Extraction"],
        summary: "Execute JavaScript",
        description:
          "Execute arbitrary JavaScript code in the browser context. Useful for dynamic content extraction.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: {
                    type: "string",
                    description:
                      "JavaScript code to execute in browser context",
                    example: "() => document.title",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "JavaScript executed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        result: {
                          description: "Result of the executed code",
                        },
                        type: {
                          type: "string",
                          description: "Type of the result",
                        },
                        code: {
                          type: "string",
                          description: "Executed code snippet",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description: "JavaScript execution failed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                    stack: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/add-init-script": {
      post: {
        tags: ["Data Extraction"],
        summary: "Add initialization script",
        description:
          "Execute JavaScript on every page load. Useful for setting up global variables or modifying behavior.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code"],
                properties: {
                  code: {
                    type: "string",
                    description: "JavaScript code to execute on each page load",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Init script added successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/console-messages": {
      get: {
        tags: ["Data Extraction"],
        summary: "Get console messages",
        description:
          "Retrieve console messages (logs, warnings, errors) from the page.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
          {
            name: "level",
            in: "query",
            schema: {
              type: "string",
              enum: ["log", "warning", "error", "info"],
            },
            description: "Filter by console message level",
          },
        ],
        responses: {
          200: {
            description: "Console messages retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        messages: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              timestamp: {
                                type: "string",
                                format: "date-time",
                              },
                              level: { type: "string" },
                              text: { type: "string" },
                              args: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    type: { type: "string" },
                                    value: {},
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/fill-form": {
      post: {
        tags: ["Form Handling"],
        summary: "Fill form fields",
        description:
          "Fill multiple form fields at once. Supports text inputs, textareas, selects, and file uploads.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fields"],
                properties: {
                  fields: {
                    type: "object",
                    description: "Object mapping field names to values",
                    additionalProperties: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Form filled successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        filled: {
                          type: "integer",
                          description: "Number of fields filled",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/select-option": {
      post: {
        tags: ["Form Handling"],
        summary: "Select option in dropdown",
        description: "Select one or more options from a select element.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["selector", "value"],
                properties: {
                  selector: {
                    type: "string",
                    description: "CSS selector for the select element",
                  },
                  value: {
                    type: "string",
                    description: "Option value to select",
                  },
                  multiple: {
                    type: "boolean",
                    default: false,
                    description: "Allow multiple selections",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Option selected successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        selected: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/check": {
      post: {
        tags: ["Form Handling"],
        summary: "Check/uncheck checkbox",
        description: "Check or uncheck a checkbox element.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["selector"],
                properties: {
                  selector: {
                    type: "string",
                    description: "CSS selector for the checkbox",
                  },
                  checked: {
                    type: "boolean",
                    default: true,
                    description: "Whether to check or uncheck",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Checkbox updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        checked: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/submit-form": {
      post: {
        tags: ["Form Handling"],
        summary: "Submit a form",
        description:
          "Click a form submit button and optionally wait for URL change.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  selector: {
                    type: "string",
                    default: "form",
                    description: "CSS selector for the form or submit button",
                  },
                  url: {
                    type: "string",
                    description: "Expected URL after submission",
                  },
                  timeout: {
                    type: "integer",
                    default: 10000,
                    description: "Timeout for URL wait in milliseconds",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Form submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        url: { type: "string", format: "uri" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/wait-for": {
      post: {
        tags: ["Advanced Features"],
        summary: "Wait for condition",
        description:
          "Wait for various page conditions: selector visibility, network idle, DOM content loaded, or custom JavaScript.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["condition"],
                properties: {
                  condition: {
                    oneOf: [
                      {
                        type: "object",
                        required: ["type", "selector"],
                        properties: {
                          type: {
                            type: "string",
                            enum: ["selector"],
                          },
                          selector: { type: "string" },
                          state: {
                            type: "string",
                            enum: ["visible", "hidden"],
                            default: "visible",
                          },
                        },
                      },
                      {
                        type: "object",
                        required: ["type"],
                        properties: {
                          type: {
                            type: "string",
                            enum: ["networkidle", "domcontentloaded", "load"],
                          },
                        },
                      },
                      {
                        type: "object",
                        required: ["type", "code"],
                        properties: {
                          type: {
                            type: "string",
                            enum: ["function"],
                          },
                          code: { type: "string" },
                        },
                      },
                    ],
                  },
                  timeout: {
                    type: "integer",
                    default: 30000,
                    description: "Timeout in milliseconds",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Condition met successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        condition: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          408: {
            description: "Timeout waiting for condition",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    error: { type: "string" },
                    condition: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/set-viewport": {
      post: {
        tags: ["Advanced Features"],
        summary: "Set viewport size",
        description:
          "Change the browser viewport size. Supports custom dimensions or predefined device presets.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  width: {
                    type: "integer",
                    description: "Viewport width in pixels",
                  },
                  height: {
                    type: "integer",
                    description: "Viewport height in pixels",
                  },
                  device: {
                    type: "string",
                    enum: ["iPhone 6", "iPhone 12", "iPad", "Desktop"],
                    description: "Predefined device preset",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Viewport set successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        viewport: {
                          type: "object",
                          properties: {
                            width: { type: "integer" },
                            height: { type: "integer" },
                          },
                        },
                        device: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/set-user-agent": {
      post: {
        tags: ["Advanced Features"],
        summary: "Set user agent",
        description: "Change the user agent string sent by the browser.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userAgent"],
                properties: {
                  userAgent: {
                    type: "string",
                    description: "User agent string",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User agent set successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        userAgent: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/sessions/{id}/set-extra-headers": {
      post: {
        tags: ["Advanced Features"],
        summary: "Set extra HTTP headers",
        description: "Add custom HTTP headers to requests.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Session identifier",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["headers"],
                properties: {
                  headers: {
                    type: "object",
                    description: "Object mapping header names to values",
                    additionalProperties: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Headers set successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        headers: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Session: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Unique session identifier",
          },
          browser: {
            type: "string",
            enum: ["chromium", "firefox", "webkit"],
          },
          status: {
            type: "string",
            enum: ["active", "closed"],
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            description: "Error message for LLM self-recovery",
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            description: "Response data",
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "API authentication (if enabled)",
      },
    },
  },
  security: [],
};

module.exports = openapiSpec;
