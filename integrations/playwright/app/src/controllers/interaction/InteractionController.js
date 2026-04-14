const { sendResponse } = require("../../utils/response");
const sessionStorage = require("../../services/session/SessionStorage");

const click = async (req, res) => {
  const { id } = req.params;
  const { selector } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.page.waitForSelector(selector, {
      state: "visible",
      timeout: 5000,
    });
    await session.page.click(selector);
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      selector,
    });
  }
};

const type = async (req, res) => {
  const { id } = req.params;
  const { selector, text, keyboard = true } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Type operation timed out")), 10000),
    );
    const typePromise = session.page.type(selector, text, { delay: 50 });

    await Promise.race([typePromise, timeoutPromise]);
    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      selector,
    });
  }
};

module.exports = {
  click,
  type,
};
