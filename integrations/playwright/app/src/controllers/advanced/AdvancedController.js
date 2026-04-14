const { sendResponse } = require("../../utils/response");
const sessionStorage = require("../../services/session/SessionStorage");

const waitFor = async (req, res) => {
  const { id } = req.params;
  const { condition, timeout = 30000 } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    if (condition.type === "selector") {
      await session.page.waitForSelector(condition.selector, {
        state: condition.state || "visible",
        timeout,
      });
    } else if (condition.type === "networkidle") {
      await session.page.waitForLoadState("networkidle", { timeout });
    } else if (condition.type === "domcontentloaded") {
      await session.page.waitForLoadState("domcontentloaded", { timeout });
    } else if (condition.type === "load") {
      await session.page.waitForLoadState("load", { timeout });
    } else if (condition.type === "function") {
      await session.page.waitForFunction(condition.code, undefined, {
        timeout,
      });
    }

    return sendResponse(res, 200, {
      success: true,
      data: { condition: condition.type },
    });
  } catch (error) {
    return sendResponse(res, 408, {
      success: false,
      error: error.message,
      condition: condition?.type,
    });
  }
};

const setViewport = async (req, res) => {
  const { id } = req.params;
  const { width, height, device = null } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    let actualWidth = width;
    let actualHeight = height;
    let deviceName = device || "custom";

    if (device) {
      const devices = {
        "iPhone 6": {
          viewport: { width: 375, height: 667 },
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1",
        },
        "iPhone 12": {
          viewport: { width: 390, height: 844 },
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        },
        iPad: {
          viewport: { width: 768, height: 1024 },
          userAgent:
            "Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1",
        },
        Desktop: {
          viewport: { width: 1920, height: 1080 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      };

      const selectedDevice = devices[device];
      if (!selectedDevice) {
        return sendResponse(res, 400, {
          success: false,
          error: `Unknown device: ${device}`,
        });
      }

      actualWidth = selectedDevice.viewport.width;
      actualHeight = selectedDevice.viewport.height;
      deviceName = device;
    }

    await session.page.setViewportSize({
      width: actualWidth,
      height: actualHeight,
    });

    return sendResponse(res, 200, {
      success: true,
      data: {
        viewport: { width: actualWidth, height: actualHeight },
        device: deviceName,
      },
    });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const setUserAgent = async (req, res) => {
  const { id } = req.params;
  const { userAgent } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.context.setExtraHTTPHeaders({ "User-Agent": userAgent });

    return sendResponse(res, 200, { success: true, data: { userAgent } });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const setExtraHeaders = async (req, res) => {
  const { id } = req.params;
  const { headers } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.page.setExtraHTTPHeaders(headers);

    return sendResponse(res, 200, { success: true, data: { headers } });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

module.exports = {
  waitFor,
  setViewport,
  setUserAgent,
  setExtraHeaders,
};
