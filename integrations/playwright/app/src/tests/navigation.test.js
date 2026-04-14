const request = require("supertest");
const app = require("../index");
const sessionStorage = require("../services/session/SessionStorage");

describe("Navigation Controller Integration Tests", () => {
  jest.setTimeout(15000);
  let sessionId;

  beforeEach(async () => {
    const res = await request(app).post("/sessions").send({ headless: true });
    sessionId = res.body.data.id;
  });

  afterEach(async () => {
    if (sessionId) {
      await request(app).delete(`/sessions/${sessionId}`);
    }
  });

  it("POST /sessions/:id/navigate - should navigate to a URL", async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toContain("example.com");
  });

  it("POST /sessions/:id/navigate - should return error for invalid URL", async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "not-a-valid-url" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /sessions/:id/back - should go back in history", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app).post(`/sessions/${sessionId}/back`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /sessions/:id/reload - should reload the page", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app).post(`/sessions/${sessionId}/reload`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
