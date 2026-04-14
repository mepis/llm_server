const request = require("supertest");
const app = require("../index");

describe("Form Controller Integration Tests", () => {
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

  it("POST /sessions/:id/fill-form - should fill form fields", async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/fill-form`)
      .send({ fields: {} });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /sessions/:id/fill-form - should return error for invalid selector", async () => {
    const res = await request(app)
      .post(`/sessions/${sessionId}/fill-form`)
      .send({ fields: { "nonexistent-field": "value" } });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  }, 15000);
});
