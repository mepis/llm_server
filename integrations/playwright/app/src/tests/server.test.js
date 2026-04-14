const request = require("supertest");
const app = require("../index");

describe("Server Integration Tests", () => {
  it("should respond to GET /health with status 200 and ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
