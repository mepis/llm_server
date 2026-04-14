const request = require("supertest");
const app = require("../index");
const sessionStorage = require("../services/session/SessionStorage");

describe("Session Controller Integration Tests", () => {
  beforeEach(() => {
    sessionStorage.sessions.clear();
  });

  it("POST /sessions - should create a new session", async () => {
    const res = await request(app)
      .post("/sessions")
      .send({
        browser: "firefox",
        headless: false,
        viewport: { width: 1920, height: 1080 },
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.browser).toBe("firefox");
    expect(res.body.data.options.viewport.width).toBe(1920);
  });

  it("GET /sessions/:id - should retrieve a session", async () => {
    const session = await sessionStorage.createSession();
    const res = await request(app).get(`/sessions/${session.id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(session.id);
  });

  it("GET /sessions/:id - should return 404 for non-existent session", async () => {
    const res = await request(app).get("/sessions/non-existent-id");

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Session not found");
  });

  it("DELETE /sessions/:id - should delete a session", async () => {
    const session = await sessionStorage.createSession();
    const res = await request(app).delete(`/sessions/${session.id}`);

    expect(res.statusCode).toEqual(204);
    expect(await sessionStorage.getSession(session.id)).toBeUndefined();
  });

  it("DELETE /sessions/:id - should return 404 for non-existent session", async () => {
    const res = await request(app).delete("/sessions/non-existent-id");

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
