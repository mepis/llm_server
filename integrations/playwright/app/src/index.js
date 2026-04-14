require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./docs/openapi");

const app = express();

// Controllers (must be imported before routes)
const sessionController = require("./controllers/sessionController");
const navigationController = require("./controllers/navigation/NavigationController");
const interactionController = require("./controllers/interaction/InteractionController");
const extractionController = require("./controllers/extraction/ExtractionController");
const formController = require("./controllers/form/FormController");
const advancedController = require("./controllers/advanced/AdvancedController");

// Rate limiting
const sessionLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  keyGenerator: (req) => req.params.id || `global-${Date.now()}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      retryAfter: 60,
    });
  },
});

const sessionCreationLimiter = rateLimit({
  windowMs: 60000,
  max: 1000,
  keyGenerator: (req) => "global-creation",
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded. Please wait before creating more sessions.",
      retryAfter: 60,
    });
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
  }),
);
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Security headers
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "X-Permitted-Cross-Domain-Policies": "master",
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Session routes (rate limited separately)
app.post("/sessions", sessionCreationLimiter, sessionController.createSession);
app.get("/sessions/:id", sessionController.getSession);
app.delete("/sessions/:id", sessionController.deleteSession);

// Apply rate limiting to session action routes
app.post(
  "/sessions/:id/navigate",
  sessionLimiter,
  navigationController.navigate,
);
app.post("/sessions/:id/back", sessionLimiter, navigationController.back);
app.post("/sessions/:id/forward", sessionLimiter, navigationController.forward);
app.post("/sessions/:id/reload", sessionLimiter, navigationController.reload);
app.post("/sessions/:id/click", sessionLimiter, interactionController.click);
app.post("/sessions/:id/type", sessionLimiter, interactionController.type);
app.post(
  "/sessions/:id/screenshot",
  sessionLimiter,
  extractionController.screenshot,
);
app.get("/sessions/:id/content", sessionLimiter, extractionController.content);
app.get("/sessions/:id/text", sessionLimiter, extractionController.text);
app.get(
  "/sessions/:id/attributes/:selector",
  sessionLimiter,
  extractionController.attributes,
);
app.post(
  "/sessions/:id/evaluate",
  sessionLimiter,
  extractionController.evaluate,
);
app.post(
  "/sessions/:id/add-init-script",
  sessionLimiter,
  extractionController.addInitScript,
);
app.get(
  "/sessions/:id/console-messages",
  sessionLimiter,
  extractionController.consoleMessages,
);
app.post("/sessions/:id/fill-form", sessionLimiter, formController.fillForm);
app.post(
  "/sessions/:id/select-option",
  sessionLimiter,
  formController.selectOption,
);
app.post("/sessions/:id/check", sessionLimiter, formController.check);
app.post(
  "/sessions/:id/submit-form",
  sessionLimiter,
  formController.submitForm,
);
app.post("/sessions/:id/wait-for", sessionLimiter, advancedController.waitFor);
app.post(
  "/sessions/:id/set-viewport",
  sessionLimiter,
  advancedController.setViewport,
);
app.post(
  "/sessions/:id/set-user-agent",
  sessionLimiter,
  advancedController.setUserAgent,
);
app.post(
  "/sessions/:id/set-extra-headers",
  sessionLimiter,
  advancedController.setExtraHeaders,
);

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
