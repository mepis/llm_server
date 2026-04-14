const { sendResponse } = require("../../utils/response");
const sessionStorage = require("../../services/session/SessionStorage");

const navigate = async (req, res) => {
  const { id } = req.params;
  const { url, waitUntil = "networkidle" } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.page.goto(url, { waitUntil, timeout: 30000 });
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    const session = await sessionStorage.getSession(id);
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      url: session?.page?.url(),
    });
  }
};

const back = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found",
      });
    }
    await session.page.goBack();
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, { success: false, error: error.message });
  }
};

const forward = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found",
      });
    }
    await session.page.goForward();
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, { success: false, error: error.message });
  }
};

const reload = async (req, res) => {
  const { id } = req.params;
  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found",
      });
    }
    await session.page.reload({
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, { success: false, error: error.message });
  }
};

module.exports = {
  navigate,
  back,
  forward,
  reload,
};
