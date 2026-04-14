const request = require('supertest');
const app = require('../index');

describe('Extraction Controller Integration Tests', () => {
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

  it('POST /sessions/:id/screenshot - should capture a screenshot', async () => {
    await request(app).post(`/sessions/${sessionId}/navigate`).send({ url: 'https://example.com' });
    
    const res = await request(app)
      .post(`/sessions/${sessionId}/screenshot`)
      .send({ fullPage: false });
    
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /sessions/:id/content - should get HTML content', async () => {
    await request(app).post(`/sessions/${sessionId}/navigate`).send({ url: 'https://example.com' });
    
    const res = await request(app).get(`/sessions/${sessionId}/content`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain('Example Domain');
  });

  it('GET /sessions/:id/text - should get text content', async () => {
    await request(app).post(`/sessions/${sessionId}/navigate`).send({ url: 'https://example.com' });
    
    const res = await request(app).get(`/sessions/${sessionId}/text`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toContain('Example Domain');
  });

  it('GET /sessions/:id/attributes/:selector - should get element attributes', async () => {
    await request(app).post(`/sessions/${sessionId}/navigate`).send({ url: 'https://example.com' });
    
    const res = await request(app).get(`/sessions/${sessionId}/attributes/a`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attributes.tagName).toBe('A');
  });

  it('POST /sessions/:id/evaluate - should execute JavaScript', async () => {
    await request(app).post(`/sessions/${sessionId}/navigate`).send({ url: 'https://example.com' });
    
    const res = await request(app)
      .post(`/sessions/${sessionId}/evaluate`)
      .send({ code: 'document.title' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.result).toBe('Example Domain');
  });

  it('POST /sessions/:id/evaluate - should return error for invalid JavaScript', async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/evaluate`)
      .send({ code: 'invalid js syntax' });
    
    expect(res.statusCode).toEqual(500);
    expect(res.body.success).toBe(false);
  });
});
