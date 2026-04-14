const { sendResponse } = require("../../utils/response");
const sessionStorage = require("../../services/session/SessionStorage");

const screenshot = async (req, res) => {
  const { id } = req.params;
  const { fullPage = false, type = "png", quality = 100 } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const screenshot = await session.page.screenshot({
      type,
      fullPage,
      quality: type === "jpeg" ? quality : undefined,
    });

    res.set({
      "Content-Type": `image/${type}`,
      "Content-Length": screenshot.length,
    });
    res.send(screenshot);
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const content = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const html = await session.page.content();
    return sendResponse(res, 200, { success: true, data: { content: html } });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const text = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const textContent = await session.page.evaluate(
      () => document.body.innerText,
    );
    return sendResponse(res, 200, {
      success: true,
      data: { text: textContent },
    });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const attributes = async (req, res) => {
  const { id, selector } = req.params;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const attributes = await session.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        innerText: element.innerText,
        attributes: Array.from(element.attributes).map((a) => ({
          name: a.name,
          value: a.value,
        })),
      };
    }, selector);

    return sendResponse(res, 200, { success: true, data: { attributes } });
  } catch (error) {
    return sendResponse(res, 400, { success: false, error: error.message });
  }
};

const evaluate = async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    console.log(`Evaluating code: ${code.substring(0, 100)}...`);

    const result = await session.page.evaluate(code);
    return sendResponse(res, 200, {
      success: true,
      data: { result, type: typeof result, code },
    });
  } catch (error) {
    return sendResponse(res, 500, {
      success: false,
      error: error.message,
      code: req.body.code,
      stack: error.stack,
    });
  }
};

const addInitScript = async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.context.addInitScript({ content: code });
    return sendResponse(res, 200, { success: true });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

const consoleMessages = async (req, res) => {
  const { id } = req.params;
  const { level } = req.query;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const messages = [];

    session.page.on("console", (msg) => {
      if (!level || msg.type() === level) {
        messages.push({
          timestamp: new Date().toISOString(),
          level: msg.type(),
          text: msg.text(),
          args: msg.args().map((arg) => ({
            type: arg.type(),
            value: arg.jsonValue
              ? arg.jsonValue()
              : arg.textContent
                ? arg.textContent()
                : null,
          })),
        });
      }
    });

    // Cleanup listener after response is sent
    const handler = (msg) => {
      if (!level || msg.type() === level) {
        messages.push({
          timestamp: new Date().toISOString(),
          level: msg.type(),
          text: msg.text(),
          args: msg.args().map((arg) => ({
            type: arg.type(),
            value: arg.jsonValue
              ? arg.jsonValue()
              : arg.textContent
                ? arg.textContent()
                : null,
          })),
        });
      }
    };

    session.page.once("console", (msg) => {
      if (!level || msg.type() === level) {
        messages.push({
          timestamp: new Date().toISOString(),
          level: msg.type(),
          text: msg.text(),
          args: msg.args().map((arg) => ({
            type: arg.type(),
            value: arg.jsonValue
              ? arg.jsonValue()
              : arg.textContent
                ? arg.textContent()
                : null,
          })),
        });
      }
    });

    return sendResponse(res, 200, { success: true, data: { messages } });
  } catch (error) {
    return sendResponse(res, 500, { success: false, error: error.message });
  }
};

module.exports = {
  screenshot,
  content,
  text,
  attributes,
  evaluate,
  addInitScript,
  consoleMessages,
};
