# Sprint 12: Testing Suite

**Duration:** 1 week  
**Phase:** Quality & Deployment (Phase 5)  
**Status:** ⏳ Pending

## Learning Objectives

- Understand Jest testing framework
- Write unit tests with Supertest
- Create browser integration tests
- Design end-to-end test scenarios
- Create test suites that simulate LLM interaction patterns
- Test API resilience to LLM-generated edge cases and malformed requests

## Goal

Create comprehensive test coverage including LLM interaction simulation.

## Deliverables

- Unit tests for all components
- Integration tests
- End-to-end tests

## Definition of Done

- [ ] Code follows linting rules
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] >80% code coverage achieved
- [ ] Code reviewed by peer/senior
- [ ] Documentation updated
- [ ] No console warnings/errors

## Tasks

### Day 1: Unit Tests Setup

- [ ] Create `src/tests/unit/` directory structure
- [ ] Set up Jest configuration:
  ```javascript
  module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/unit/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/tests/**',
      '!src/index.js'
    ],
    setupFilesAfterEnv: ['jest-extended/all']
  };
  ```
- [ ] Create test utilities in `src/tests/unit/utils/`

### Day 2-3: Unit Tests

- [ ] Create unit tests for controllers:
  ```javascript
  const request = require('supertest');
  const app = require('../../src');
  
  describe('Session Controller', () => {
    describe('POST /sessions', () => {
      it('should create a new session', async () => {
        const response = await request(app)
          .post('/sessions')
          .send({ browser: 'chromium', headless: true });
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.browser).toBe('chromium');
      });
    });
  });
  ```
- [ ] Create unit tests for utilities
- [ ] Create unit tests for services
- [ ] Achieve >80% coverage

### Day 4-5: Integration & E2E Tests

- [ ] Create integration tests for API endpoints in `src/tests/integration/`
- [ ] Create browser integration tests in `src/tests/integration/browser/`
- [ ] Create session integration tests
- [ ] Test concurrent operations
- [ ] Create E2E test scenarios in `src/tests/e2e/`
- [ ] Test full workflows
- [ ] Test error scenarios
- [ ] Test browser crashes

## Pair Programming Recommendation

- Pair when creating unit tests (Day 1-3)
- Pair when creating E2E tests (Day 4-5)

## Troubleshooting Tips

- **Issue: Tests run slowly** - Use `test.concurrent` for parallel tests, reduce timeout values
- **Issue: Browser tests fail** - Use `test.afterEach(() => browser.close())` to close browser
- **Issue: Coverage not increasing** - Check `collectCoverageFrom` config, ensure all files are included

## Acceptance Criteria

- >80% code coverage
- All endpoints tested
- Browser operations tested
- Error scenarios tested
- Concurrent operations work
- LLM interaction patterns are tested with simulated tool-calling workflows
- API handles malformed LLM-generated requests gracefully

## Next Sprint

[Sprint 13: Docker & Deployment Prep](./sprint-13-docker-deployment.md)

## Previous Sprint

[Sprint 11: API Documentation](./sprint-11-api-documentation.md)
