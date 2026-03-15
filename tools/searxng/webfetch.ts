#!/usr/bin/env node
/**
 * SearxNG Search Tool for Opencode (TypeScript version)
 *
 * Usage:
 *   npx ts-node tools/searxng_search.ts "<query>"
 *
 * This script reads configuration from config.json and performs a search
 * using the SearxNG instance URL specified in the config.
 * The results are output as formatted JSON.
 */

const fs = require('fs');
const path = require('path');
const fetchLib = require('node-fetch').default;

// Set global agent to ignore cert errors
const https = require('https');
https.globalAgent = new https.Agent({ rejectUnauthorized: false });

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const SEARXNG_URL = config.searxng_url;

// Parse command line argument
const query = process.argv[2];
if (!query) {
  console.error('Usage: ts-node searxng_search.ts "<query>"');
  process.exit(1);
}

// Build request URL
const params = new URLSearchParams({
  q: query,
  format: 'json',
  language: config.default_language || 'en',
});
const requestUrl = `${SEARXNG_URL.replace(/\/$/, '')}/search?${params.toString()}`;

// Perform request
(async () => {
  try {
    const refererUrl = new URL(SEARXNG_URL);
      const response = await fetchLib(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Referer': `${refererUrl.origin}/`,
        'Origin': refererUrl.origin,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Search failed:', error);
    process.exit(1);
  }
})();