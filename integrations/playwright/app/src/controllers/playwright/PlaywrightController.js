const { chromium, firefox, webkit } = require("playwright");

class PlaywrightController {
  constructor(options = {}) {
    this.browserType = options.browser || "chromium";
    this.options = {
      headless: options.headless !== undefined ? options.headless : true,
      slowMo: options.slowMo || 0,
      viewport: options.viewport || { width: 1280, height: 720 },
      userAgent: options.userAgent,
    };
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async launch() {
    try {
      const browserLauncher = {
        chromium,
        firefox,
        webkit,
      }[this.browserType];

      if (!browserLauncher) {
        throw new Error(`Unsupported browser type: ${this.browserType}`);
      }

      this.browser = await browserLauncher.launch({
        headless: this.options.headless,
        slowMo: this.options.slowMo,
      });

      return this.browser;
    } catch (error) {
      throw new Error(`Failed to launch ${this.browserType}: ${error.message}`);
    }
  }

  async createContext() {
    if (!this.browser) {
      throw new Error("Browser not launched. Call launch() first.");
    }

    try {
      this.context = await this.browser.newContext({
        viewport: this.options.viewport,
        userAgent: this.options.userAgent,
      });
      return this.context;
    } catch (error) {
      throw new Error(`Failed to create context: ${error.message}`);
    }
  }

  async createPage() {
    if (!this.context) {
      throw new Error(
        "Browser context not created. Call createContext() first.",
      );
    }

    try {
      this.page = await this.context.newPage();
      return this.page;
    } catch (error) {
      throw new Error(`Failed to create page: ${error.message}`);
    }
  }

  async withRetry(operation, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(
          `Operation failed (attempt ${i + 1}/${retries}). Retrying in ${delay * (i + 1)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw lastError;
  }

  async close() {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error(`Error during shutdown: ${error.message}`);
    } finally {
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}

module.exports = PlaywrightController;
