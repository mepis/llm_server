#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting LLM Assistance API...");

// Check if environment file exists
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.log("⚠️  No .env file found. Using defaults...");
}

// Start the server
try {
  execSync("node src/index.js", {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "development" },
  });
} catch (error) {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
}
