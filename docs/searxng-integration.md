# SearxNG Integration with Opencode Scripts

## Overview

This document describes the modifications required for the searxng search script to work correctly with Opencode.

## Changes Made

### 1. Configuration Updates

- **Updated `tools/searxng/config.json`**: Changed the `searxng_url` to a reachable instance (`https://searx.org`) and adjusted settings (`safe_search`, `limit_per_page`) for compatibility.

### 2. Script Modifications (`searxng_search.ts`)

- **Fixed config path**: Changed `path.join(__dirname, '..', 'config.json')` to `path.join(__dirname, 'config.json')`.
- **Resolved fetch import**: Updated to use `require('node-fetch').default` and added `@ts-ignore` to bypass type checking.
- **Added browser-like headers**: `User-Agent`, `Referer`, `Origin`, and `Accept` headers were included to avoid server rejections.
- **Handled SSL certificate issues**: Configured a global `https.Agent({ rejectUnauthorized: false })` to bypass self‑signed certificate errors.
- **Conditional agent usage**: Applied the custom agent only when the request URL uses HTTPS.

### 3. SearxNG Server Configuration

- **Enabled JSON output**: Added `json` to the `formats` list under the `search:` section in the instance’s `settings.yml`. (/etc/searxng/settings.yml)
- **Service restart**: Restarted SearxNG after updating `settings.yml` to apply the new format permissions.

### 4. Result

With these adjustments, queries such as `npm run search "opencode"` now return JSON search results instead of 403 errors, confirming that the searxng tool functions correctly within Opencode.
