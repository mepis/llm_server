# API Design Document

This document holds high-level API design decisions, endpoint conventions, data models, authentication patterns, and versioning guidance for the LLM Server project.

Sections (placeholder until detailed design is added):
- API Overview
- Endpoints Design
- Request/Response Schemas
- Authentication & RBAC
- Versioning & Deprecations
- Error Handling
- Security Considerations

Note: Replace this placeholder with detailed OpenAPI-like specifications as the project evolves.

## API Specification (OpenAPI-like)

Below is a concrete, OpenAPI-like specification reflecting the API surface exposed by the current backend architecture as documented in the AGENTS.md and the repository routing. This is intended as a living design reference to guide implementation and onboarding. It may evolve as endpoints are implemented or renamed.

```yaml
openapi: 3.0.3
info:
  title: LLM Server API
  version: 1.0.0
  description: OpenAPI-like specification for the LLM Server backend endpoints (auth, users, chat, prompts, tools, rag, matrix, llm, logs, monitor).
servers:
  - url: http://localhost:3000/api
    description: Local development API
tags:
  - name: auth
  - name: users
  - name: chat
  - name: prompts
  - name: tools
  - name: rag
  - name: matrix
  - name: llm
  - name: logs
  - name: monitor
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    StandardResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          additionalProperties: true
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        code:
          type: integer
    User:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        email:
          type: string
        roles:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    AuthRequest:
      type: object
      properties:
        username:
          type: string
        password:
          type: string
      required:
        - username
        - password
    AuthResponse:
      type: object
      properties:
        token:
          type: string
        user:
          $ref: '#/components/schemas/User'
    ChatSession:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        createdAt:
          type: string
          format: date-time
    Tool:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        roles:
          type: array
          items:
            type: string

paths:
  /api/auth/login:
    post:
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AuthRequest'
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  /api/auth/logout:
    post:
      tags: [auth]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Logout success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/auth/register:
    post:
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
                email:
                  type: string
              required: [username, password, email]
      responses:
        '200':
          description: User registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/users/me:
    get:
      tags: [users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Current user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    put:
      tags: [users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    delete:
      tags: [users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/users:
    get:
      tags: [users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    post:
      tags: [users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
                email:
                  type: string
                roles:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/users/{id}:
    get:
      tags: [users]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: User
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    put:
      tags: [users]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    delete:
      tags: [users]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/chat/sessions:
    get:
      tags: [chat]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Sessions list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    post:
      tags: [chat]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
      responses:
        '200':
          description: Created session
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/chat/sessions/{sessionId}:
    get:
      tags: [chat]
      security:
        - bearerAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Session details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    delete:
      tags: [chat]
      security:
        - bearerAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/prompt:
    get:
      tags: [prompts]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List prompts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    post:
      tags: [prompts]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                content:
                  type: string
      responses:
        '200':
          description: Created prompt
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/prompt/{id}:
    get:
      tags: [prompts]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Prompt
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    put:
      tags: [prompts]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                content:
                  type: string
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    delete:
      tags: [prompts]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/tools:
    get:
      tags: [tools]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List tools
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    post:
      tags: [tools]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
                roles:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Created tool
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/tools/{id}:
    get:
      tags: [tools]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Tool
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    put:
      tags: [tools]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
    delete:
      tags: [tools]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/tools/{id}/call:
    post:
      tags: [tools]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                params:
                  type: object
      responses:
        '200':
          description: Tool call result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/logs:
    get:
      tags: [logs]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
        - name: limit
          in: query
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: Logs list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/logs/{id}:
    get:
      tags: [logs]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Log entry
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/matrix:
    get:
      tags: [matrix]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Matrix sessions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/matrix/{id}:
    get:
      tags: [matrix]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Matrix item
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/monitor/health:
    get:
      tags: [monitor]
      responses:
        '200':
          description: Health status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/llm/chat:
    post:
      tags: [llm]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                messages:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: LLM chat response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
  /api/skills:
    get:
      tags: [auth]
      responses:
        '200':
          description: Available skills
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
``` 
