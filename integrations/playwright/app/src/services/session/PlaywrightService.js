const sessionStorage = require("./SessionStorage");
const PlaywrightController = require("../../controllers/playwright/PlaywrightController");

class PlaywrightService {
  async createSession(options) {
    const sessionData = await sessionStorage.createSession(options);

    const controller = new PlaywrightController({
      browser: sessionData.browser,
      ...sessionData.options,
    });

    await controller.launch();
    const context = await controller.createContext();
    const page = await controller.createPage();

    // Attach live objects to the session object in memory
    sessionData.controller = controller;
    sessionData.context = context;
    sessionData.page = page;

    return sessionData;
  }

  async getSession(sessionId) {
    return await sessionStorage.getSession(sessionId);
  }

  async closeSession(sessionId) {
    const session = await sessionStorage.getSession(sessionId);
    if (!session) {
      return false;
    }
    if (session.controller) {
      try {
        await session.controller.close();
      } catch (error) {
        console.error(`Error closing session ${sessionId}: ${error.message}`);
      }
    }
    return await sessionStorage.deleteSession(sessionId);
  }
}

module.exports = new PlaywrightService();
