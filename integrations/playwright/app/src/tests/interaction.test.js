const request = require("supertest");
const app = require("../index");
const sessionStorage = require("../services/session/SessionStorage");

describe("Interaction Controller Integration Tests", () => {
  jest.setTimeout(20000);
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

  it("POST /sessions/:id/click - should click an element", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .post(`/sessions/${sessionId}/click`)
      .send({ selector: "a" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /sessions/:id/click - should return error for invalid selector", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .post(`/sessions/${sessionId}/click`)
      .send({ selector: "#nonexistent-element-12345" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /sessions/:id/type - should type into an element", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .post(`/sessions/${sessionId}/type`)
      .send({ selector: "a", text: "test" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /sessions/:id/type - should return error for invalid selector", async () => {
    await request(app)
      .post(`/sessions/${sessionId}/navigate`)
      .send({ url: "https://example.com" });

    const res = await request(app)
      .post(`/sessions/${sessionId}/type`)
      .send({ selector: "#nonexistent-element-12345", text: "test" });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });
});
