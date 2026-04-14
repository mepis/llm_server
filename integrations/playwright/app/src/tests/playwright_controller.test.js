const PlaywrightController = require("../controllers/playwright/PlaywrightController");

describe("PlaywrightController", () => {
  let controller;

  beforeEach(() => {
    controller = new PlaywrightController({ headless: true });
  });

  afterEach(async () => {
    await controller.close();
  });

  it("should launch browser and create context and page", async () => {
    await controller.launch();
    const context = await controller.createContext();
    const page = await controller.createPage();

    expect(controller.browser).not.toBeNull();
    expect(context).not.toBeNull();
    expect(page).not.toBeNull();
  });

  it("should throw error if createContext is called before launch", async () => {
    await expect(controller.createContext()).rejects.toThrow(
      "Browser not launched",
    );
  });

  it("should throw error if createPage is called before context is created", async () => {
    await controller.launch();
    await expect(controller.createPage()).rejects.toThrow(
      "Browser context not created",
    );
  });

  it("should handle unsupported browser type", async () => {
    const invalidController = new PlaywrightController({ browser: "opera" });
    await expect(invalidController.launch()).rejects.toThrow(
      "Unsupported browser type",
    );
  });

  it("should retry operations using withRetry", async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) throw new Error("Transient error");
      return "success";
    };

    const result = await controller.withRetry(operation, 3, 10);
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should fail with error after maximum retries", async () => {
    const operation = async () => {
      throw new Error("Persistent error");
    };

    await expect(controller.withRetry(operation, 3, 10)).rejects.toThrow(
      "Persistent error",
    );
  });
});
