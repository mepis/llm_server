const sanitizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
};

const sanitizeSelector = (selector) => {
  if (!selector || typeof selector !== "string") {
    throw new Error("Selector must be a non-empty string");
  }
  const cleaned = selector.replace(/[<>\"'\\]/g, "");
  if (cleaned.length === 0) {
    throw new Error("Selector cannot be empty after sanitization");
  }
  return cleaned;
};

const sanitizeJavaScript = (code) => {
  if (!code || typeof code !== "string") {
    throw new Error("Code must be a non-empty string");
  }
  let cleaned = code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  if (cleaned.length === 0) {
    throw new Error("Code cannot be empty after sanitization");
  }

  return cleaned;
};

module.exports = {
  sanitizeUrl,
  sanitizeSelector,
  sanitizeJavaScript,
};
