const { sendResponse } = require("../utils/response");
const sessionStorage = require("../services/session/SessionStorage");
const playwrightService = require("../services/session/PlaywrightService");

const createSession = async (req, res) => {
  try {
    const {
      browser = "chromium",
      headless = true,
      viewport = { width: 1280, height: 720 },
    } = req.body;
    const session = await playwrightService.createSession({
      browser,
      headless,
      viewport,
    });
    return sendResponse(res, 201, { success: true, data: session });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionStorage.getSession(id);
    if (!session) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found",
      });
    }
    return sendResponse(res, 200, { success: true, data: session });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await playwrightService.closeSession(id);
    if (!deleted) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found",
      });
    }
    return sendResponse(res, 204, { success: true });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
};
