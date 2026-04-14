const request = require('supertest');
const app = require('../index');

describe('Advanced Controller Integration Tests', () => {
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

  it('POST /sessions/:id/wait-for - should wait for network idle', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/wait-for`)
      .send({ condition: { type: 'networkidle' }, timeout: 10000 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /sessions/:id/set-viewport - should set custom viewport', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/set-viewport`)
      .send({ width: 800, height: 600 });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.viewport.width).toBe(800);
  });

  it('POST /sessions/:id/set-viewport - should set device viewport', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/set-viewport`)
      .send({ device: 'iPhone 12' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.viewport.width).toBe(390);
  });

  it('POST /sessions/:id/set-user-agent - should set user agent', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/set-user-agent`)
      .send({ userAgent: 'Custom User Agent' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /sessions/:id/set-extra-headers - should set extra headers', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/set-extra-headers`)
      .send({ headers: { 'X-Custom-Header': 'test' } });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
