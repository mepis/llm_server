const { sendResponse } = require("../../utils/response");
const sessionStorage = require("../../services/session/SessionStorage");

const fillForm = async (req, res) => {
  const { id } = req.params;
  const { fields } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const filledFields = [];
    for (const [name, value] of Object.entries(fields)) {
      let selector;

      let isFileInput = false;

      if (name.endsWith(".file")) {
        isFileInput = true;
        selector = `input[type="file"][name="${name.slice(0, -5)}"]`;
      } else {
        selector = `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`;
      }

      if (
        isFileInput &&
        !(await session.page.locator(selector).count()).greaterThan(0)
      ) {
        throw new Error(
          `File input with name "${name.slice(0, -5)}" not found`,
        );
      }

      await session.page.waitForSelector(selector, {
        state: "visible",
        timeout: 5000,
      });

      if (name.endsWith(".file")) {
        await session.page.setInputFiles(selector, value);
      } else {
        await session.page.fill(selector, value);
      }

      filledFields.push(name);
    }

    return sendResponse(res, 200, {
      success: true,
      data: { filled: filledFields.length },
    });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      fields: Object.keys(fields),
    });
  }
};

const selectOption = async (req, res) => {
  const { id } = req.params;
  const { selector, value, multiple = false } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    await session.page.selectOption(selector, value, {
      timeout: 5000,
    });
    return sendResponse(res, 200, { success: true, data: { selected: value } });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      selector,
    });
  }
};

const check = async (req, res) => {
  const { id } = req.params;
  const { selector, checked = true } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const locator = session.page.locator(selector);
    const isChecked = await locator.isChecked();

    if (checked && !isChecked) {
      await locator.check();
    } else if (!checked && isChecked) {
      await locator.uncheck();
    }

    return sendResponse(res, 200, { success: true, data: { checked } });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
      selector,
    });
  }
};

const submitForm = async (req, res) => {
  const { id } = req.params;
  const { selector = "form", url, timeout = 10000 } = req.body;

  try {
    const session = await sessionStorage.getSession(id);
    if (!session || !session.page) {
      return sendResponse(res, 404, {
        success: false,
        error: "Session not found or page not initialized",
      });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Submit form operation timed out")),
        5000,
      ),
    );
    const clickPromise = session.page.click(selector);

    await Promise.race([clickPromise, timeoutPromise]);

    if (url) {
      await session.page.waitForURL(url, { timeout });
    }

    return sendResponse(res, 200, {
      success: true,
      data: { url: session.page.url() },
    });
  } catch (error) {
    return sendResponse(res, 400, {
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  fillForm,
  selectOption,
  check,
  submitForm,
};
