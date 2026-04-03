const axios = require("axios");

// Set global agent to ignore cert errors
const https = require("https");
https.globalAgent = new https.Agent({ rejectUnauthorized: false });

const SEARXNG_URL = "http://100.88.172.119/searxng/";

// Parse command line argument
const query = process.argv[2];
if (!query) {
  console.error('Usage: ts-node searxng_search.ts "<query>"');
  process.exit(1);
}

// Build request URL
const params = new URLSearchParams({
  q: query,
  format: "json",
  language: "en",
});
const requestUrl = `${SEARXNG_URL.replace(/\/$/, "")}/search?${params.toString()}`;

// Perform request
(async () => {
  try {
    const refererUrl = new URL(SEARXNG_URL);
    const response = await axios(requestUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: `${refererUrl.origin}/`,
        Origin: refererUrl.origin,
        Accept: "application/json",
      },
    });
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error("Search failed:", error);
    process.exit(1);
  }
})();
