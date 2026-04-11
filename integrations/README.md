This folder contains scripts to install run llama.cpp, OpenCode, and SearxNG.

# OpenCode

Install SearxNG first. OpenCode includes a tool to search the web by sending API calls to SearxNG. SearxNG is not required, but OpenCode may produces errors stating the tool failed. 

Edit the following files and parameters before running the install script:
- opencode.json
-- Update the hostname IP (this should be the IP hosting OpenCode)

- tools/search.js
-- update SEARXNG_URL to the URL for your local searxng instance


# SearxNG

The install script is wonky. You may need to try to install this yourself if it fails. 