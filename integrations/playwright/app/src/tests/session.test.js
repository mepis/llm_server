const sessionStorage = require("../services/session/SessionStorage");

describe("SessionStorage", () => {
  beforeEach(() => {
    // Clear sessions before each test
    sessionStorage.sessions.clear();
  });

  it("should create a new session with unique ID", async () => {
    const session = await sessionStorage.createSession({ browser: "firefox" });
    expect(session.id).toBeDefined();
    expect(session.browser).toBe("firefox");
    expect(session.status).toBe("active");
  });

  it("should retrieve an existing session and update lastUsedAt", async () => {
    const session = await sessionStorage.createSession();
    const initialLastUsedAt = session.lastUsedAt;

    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const retrieved = await sessionStorage.getSession(session.id);
    expect(retrieved.id).toBe(session.id);
    expect(retrieved.lastUsedAt).toBeGreaterThan(initialLastUsedAt);
  });

  it("should return null for non-existent session", async () => {
    const session = await sessionStorage.getSession("non-existent-id");
    expect(session).toBeUndefined(); // Map.get returns undefined if not found
  });

  it("should delete a session", async () => {
    const session = await sessionStorage.createSession();
    const deleted = await sessionStorage.deleteSession(session.id);
    expect(deleted).toBe(true);
    expect(await sessionStorage.getSession(session.id)).toBeUndefined();
  });

  it("should cleanup inactive sessions", async () => {
    const session = await sessionStorage.createSession();

    // Manually manipulate lastUsedAt to simulate inactivity
    session.lastUsedAt = Date.now() - 10000; // 10 seconds ago

    await sessionStorage.cleanupInactiveSessions(5000); // timeout of 5s
    expect(sessionStorage.sessionCount).toBe(0);
  });
});
