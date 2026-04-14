const {
  sanitizeUrl,
  sanitizeSelector,
  sanitizeJavaScript,
} = require("../utils/sanitizer");

describe("Security Features - Input Sanitization", () => {
  it("sanitizeUrl - should sanitize valid URL", () => {
    const result = sanitizeUrl("https://example.com/path?query=1");
    expect(result).toBe("https://example.com/path?query=1");
  });

  it("sanitizeUrl - should throw error for invalid URL", () => {
    expect(() => sanitizeUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("sanitizeSelector - should sanitize valid selector", () => {
    const result = sanitizeSelector("#id.class[attr]");
    expect(result).toBe("#id.class[attr]");
  });

  it("sanitizeSelector - should remove dangerous characters", () => {
    const result = sanitizeSelector("<script>alert(1)</script>");
    expect(result).toBe("scriptalert(1)/script");
  });

  it("sanitizeJavaScript - should remove comments", () => {
    const result = sanitizeJavaScript("// comment\nconst x = 1;");
    expect(result).toBe("const x = 1;");
  });

  it("sanitizeJavaScript - should remove block comments", () => {
    const result = sanitizeJavaScript("/* block */ const x = 1;");
    expect(result).toBe("const x = 1;");
  });
});
