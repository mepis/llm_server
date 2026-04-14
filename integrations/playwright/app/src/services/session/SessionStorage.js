const { v4: uuidv4 } = require("uuid");

class SessionStorage {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(options = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      browser: options.browser || "chromium",
      contextId: null,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      status: "active",
      options: {
        headless: options.headless !== undefined ? options.headless : true,
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent || undefined,
      },
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastUsedAt = Date.now();
    }
    return session;
  }

  async deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  async getAllSessions() {
    return Array.from(this.sessions.values());
  }

  async cleanupInactiveSessions(timeoutMs) {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastUsedAt > timeoutMs) {
        this.sessions.delete(id);
      }
    }
  }

  get sessionCount() {
    return this.sessions.size;
  }
}

module.exports = new SessionStorage();
