const request = require('supertest');
const app = require('../index');

describe('JavaScript Execution Integration Tests', () => {
  jest.setTimeout(20000);
  let sessionId;

  beforeEach(async () => {
    const res = await request(app).post('/sessions').send({ headless: true });
    sessionId = res.body.data.id;
  });

  afterEach(async () => {
    if (sessionId) {
      await request(app).delete(`/sessions/${sessionId}`);
    }
  });

  it('POST /sessions/:id/evaluate - should execute JavaScript', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/evaluate`)
      .send({ code: '1 + 1' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result).toBe(2);
  });

  it('POST /sessions/:id/evaluate - should execute async JavaScript', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/evaluate`)
      .send({ code: 'async () => { return await Promise.resolve("done"); }' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /sessions/:id/evaluate - should return error for invalid JavaScript', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/evaluate`)
      .send({ code: 'invalid syntax here' });
    
    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
  });

  it('POST /sessions/:id/add-init-script - should add init script', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/add-init-script`)
      .send({ code: 'window.testVar = "initialized";' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /sessions/:id/console-messages - should get console messages', async () => {
    const res = await request(app).get(`/sessions/${sessionId}/console-messages`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.messages)).toBe(true);
  });

  it('GET /sessions/:id/console-messages - should filter by level', async () => {
    const res = await request(app)
      .get(`/sessions/${sessionId}/console-messages?level=info`)
      .send();
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
