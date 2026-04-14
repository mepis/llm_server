# Sprint 11: API Documentation (OpenAPI)

**Duration:** 1 week  
**Phase:** Production Readiness (Phase 4)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand OpenAPI 3.0 specification
- Document REST API endpoints
- Create interactive Swagger UI
- Write comprehensive usage examples
- Generate OpenAPI specifications with LLM-friendly examples and clear parameter descriptions
- Document tool-calling patterns and common LLM workflows

## Goal

Generate OpenAPI/Swagger documentation optimized for LLM tool discovery and usage.

## Deliverables

- OpenAPI 3.0 specification
- Swagger UI integration
- Usage examples

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] OpenAPI spec generated and validated
- [ ] Swagger UI accessible and working
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: OpenAPI Specification

- [ ] Create `src/docs/openapi.js` with OpenAPI spec:
  ```javascript
  const openapiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'LLM Assistance API',
      version: '1.0.0',
      description: 'API for LLMs to interact with web pages via Playwright'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ],
    paths: {
      '/sessions': {
        post: {
          summary: 'Create a new browser session',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    browser: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] },
                    headless: { type: 'boolean', default: true },
                    viewport: { type: 'object', properties: { width: { type: 'integer' }, height: { type: 'integer' } } }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { id: { type: 'string' }, browser: { type: 'string' }, status: { type: 'string' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  ```
- [ ] Define all endpoints
- [ ] Define request/response schemas
- [ ] Add descriptions

### Day 2-3: Swagger UI Integration

- [ ] Install `swagger-ui-express`:
  ```bash
  npm install swagger-ui-express
  ```
- [ ] Add `/docs` route:
  ```javascript
  const swaggerUi = require('swagger-ui-express');
  const spec = require('../docs/openapi.js').default;
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  ```
- [ ] Configure OpenAPI spec

### Day 4-5: Examples & Documentation

- [ ] Create usage examples in `src/docs/examples/`:
  ```javascript
  // Example: Create session
  const response = await fetch('http://localhost:3000/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      browser: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 720 }
    })
  });
  
  const session = await response.json();
  console.log(`Session created: ${session.id}`);
  ```
- [ ] Create Postman collection in `docs/postman/`
- [ ] Write documentation in `docs/api.md`

## Pair Programming Recommendation

- Pair when creating OpenAPI spec (Day 1)
- Pair when creating examples and documentation (Day 4-5)

## Troubleshooting Tips

- **Issue: Swagger UI not loading** - Check if openapi.js exports default, verify `/docs` route is mounted
- **Issue: Schema validation errors** - Ensure all required fields have proper types and formats
- **Issue: Examples not working** - Test each example individually, check for async/await

## Acceptance Criteria

- OpenAPI spec is valid
- Swagger UI is accessible
- All endpoints are documented
- Examples are working
- API documentation includes LLM-specific usage patterns
- Examples demonstrate common LLM tool-calling workflows

## Next Sprint

[Sprint 12: Testing Suite](./sprint-12-testing-suite.md)

## Previous Sprint

[Sprint 10: Error Handling & Logging](./sprint-10-error-handling-logging.md)
