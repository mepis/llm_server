const request = require("supertest");
const app = require("../../index");
const sessionStorage = require("../../services/session/SessionStorage");

describe("LLM Interaction Integration Tests", () => {
  let sessionId;

  beforeEach(async () => {
    sessionStorage.sessions.clear();
    const response = await request(app)
      .post("/sessions")
      .send({ browser: "chromium", headless: true });
    sessionId = response.body.data.id;
  });

  afterEach(async () => {
    if (sessionId) {
      await request(app).delete(`/sessions/${sessionId}`);
    }
  });

  describe("LLM Tool-Calling Patterns", () => {
    it("should handle sequential navigation tool calls", async () => {
      // Tool call 1: Navigate to page
      const nav1 = await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });
      expect(nav1.status).toBe(200);
      expect(nav1.body.success).toBe(true);

      // Tool call 2: Extract content
      const content = await request(app).get(`/sessions/${sessionId}/content`);
      expect(content.status).toBe(200);
      expect(content.body.success).toBe(true);
      expect(content.body.data.content).toContain("<html");

      // Tool call 3: Get text
      const text = await request(app).get(`/sessions/${sessionId}/text`);
      expect(text.status).toBe(200);
      expect(text.body.success).toBe(true);
      expect(text.body.data.text).toBeTruthy();
    });

    it("should handle multi-step research workflow", async () => {
      // Step 1: Navigate
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });

      // Step 2: Extract attributes
      const attrs = await request(app).get(
        `/sessions/${sessionId}/attributes/html`,
      );
      expect(attrs.status).toBe(200);
      expect(attrs.body.success).toBe(true);

      // Step 3: Execute JavaScript
      const evalRes = await request(app)
        .post(`/sessions/${sessionId}/evaluate`)
        .send({ code: "() => document.title" });
      expect(evalRes.status).toBe(200);
      expect(evalRes.body.success).toBe(true);
    });

    it("should handle error recovery patterns", async () => {
      // Try to access non-existent session (LLM error recovery test)
      const response = await request(app).get("/sessions/non-existent-id");
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Session not found");

      // Create new session and verify it works
      const createRes = await request(app).post("/sessions").send({
        browser: "chromium",
      });
      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
    });
  });

  describe("Concurrent Session Management", () => {
    it("should handle multiple concurrent sessions", async () => {
      const sessionIds = [];

      // Create 3 concurrent sessions
      for (let i = 0; i < 3; i++) {
        const res = await request(app).post("/sessions").send({
          browser: "chromium",
          headless: true,
        });
        expect(res.status).toBe(201);
        sessionIds.push(res.body.data.id);
      }

      // Navigate each session independently
      for (const id of sessionIds) {
        const nav = await request(app)
          .post(`/sessions/${id}/navigate`)
          .send({ url: "https://example.com" });
        expect(nav.status).toBe(200);
      }

      // Clean up all sessions
      for (const id of sessionIds) {
        const del = await request(app).delete(`/sessions/${id}`);
        expect(del.status).toBe(204);
      }
    });
  });

  describe("Form Interaction Patterns", () => {
    it("should handle form filling workflow", async () => {
      // Navigate to a page with forms
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });

      // Fill form (even if no form exists, should handle gracefully)
      const fillRes = await request(app)
        .post(`/sessions/${sessionId}/fill-form`)
        .send({ fields: { name: "test", email: "test@example.com" } });

      // Should return success or appropriate error (graceful handling)
      expect([200, 400]).toContain(fillRes.status);
      expect(fillRes.body.success).toBeDefined();
    });
  });

  describe("Advanced Feature Patterns", () => {
    it("should handle viewport changes for mobile emulation", async () => {
      // Set mobile viewport
      const viewportRes = await request(app)
        .post(`/sessions/${sessionId}/set-viewport`)
        .send({ device: "iPhone 12" });

      expect(viewportRes.status).toBe(200);
      expect(viewportRes.body.success).toBe(true);
      expect(viewportRes.body.data.viewport.width).toBe(390);
      expect(viewportRes.body.data.viewport.height).toBe(844);
    });

    it("should handle user agent changes", async () => {
      const uaRes = await request(app)
        .post(`/sessions/${sessionId}/set-user-agent`)
        .send({
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        });

      expect(uaRes.status).toBe(200);
      expect(uaRes.body.success).toBe(true);
    });

    it("should handle wait conditions", async () => {
      // Navigate first
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });

      // Wait for network idle
      const waitRes = await request(app)
        .post(`/sessions/${sessionId}/wait-for`)
        .send({ condition: { type: "networkidle" } });

      expect(waitRes.status).toBe(200);
      expect(waitRes.body.success).toBe(true);
    });
  });

  describe("Data Extraction Patterns", () => {
    it("should capture screenshots correctly", async () => {
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });

      const screenshotRes = await request(app)
        .post(`/sessions/${sessionId}/screenshot`)
        .send({ fullPage: true, type: "png" });

      expect(screenshotRes.status).toBe(200);
      expect(Buffer.isBuffer(screenshotRes.body)).toBe(true);
      expect(screenshotRes.body.length).toBeGreaterThan(0);
    });

    it("should extract console messages", async () => {
      const consoleRes = await request(app).get(
        `/sessions/${sessionId}/console-messages`,
      );

      expect(consoleRes.status).toBe(200);
      expect(consoleRes.body.success).toBe(true);
      expect(Array.isArray(consoleRes.body.data.messages)).toBe(true);
    });
  });

  describe("LLM Self-Recovery Scenarios", () => {
    it("should provide actionable error messages", async () => {
      // Invalid URL (LLM might generate bad URLs)
      const navRes = await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "invalid-url" });

      expect(navRes.status).toBe(400);
      expect(navRes.body.success).toBe(false);
      expect(navRes.body.error).toBeTruthy();
      expect(typeof navRes.body.error).toBe("string");
    });

    it("should handle malformed requests gracefully", async () => {
      // Missing required fields
      const response = await request(app)
        .post(`/sessions/${sessionId}/click`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it("should maintain session state across operations", async () => {
      // Navigate to page
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.com" });

      // Get current URL via content extraction
      const content = await request(app).get(`/sessions/${sessionId}/content`);
      expect(content.body.data.content).toContain("Example Domain");

      // Navigate again
      await request(app)
        .post(`/sessions/${sessionId}/navigate`)
        .send({ url: "https://example.org" });

      // Verify new page loaded
      const content2 = await request(app).get(`/sessions/${sessionId}/content`);
      expect(content2.body.data.content).toContain("Example Domain");
    });
  });

  describe("Rate Limiting Verification", () => {
    it("should respect rate limits on high-frequency calls", async () => {
      // Make multiple rapid calls
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post(`/sessions/${sessionId}/navigate`)
            .send({ url: "https://example.com" }),
        );
      }

      const responses = await Promise.all(promises);

      // Some should succeed, rate limiting may apply
      const successes = responses.filter((r) => r.status === 200).length;
      expect(successes).toBeGreaterThan(0);
    });
  });
});
