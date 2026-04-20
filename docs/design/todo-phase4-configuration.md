# Phase 4: Update Configuration

## Goal
Add the `chatterbox` configuration section to `src/config/database.js` and add 6 environment variables to `.env`. This provides the Node.js backend with connection details and default parameters for the Chatterbox gRPC service.

---

## Todo Items

### 4.1 — Add chatterbox config section to database.js

**File path:** `/home/jon/git/llm_server/src/config/database.js`

**Action:** Find the existing `llama` section (lines 24-28) and add a new `chatterbox` section immediately after it.

**Current file structure (what you're editing):**
```javascript
module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  mongodb: { ... },      // lines 10-17
  jwt: { ... },          // lines 19-22
  llama: {               // lines 24-28
    url: process.env.LLAMA_SERVER_URL || 'http://localhost:8082',
    timeout: parseInt(process.env.LLAMA_TIMEOUT) || 30000,
    ttsSpeakerFile: process.env.TTS_SPEAKER_FILE || null,
  },

  matrix: { ... },       // lines 30-34
  sessionTimeout: ...,   // line 36
  maxFileSize: ...       // line 37
};
```

**Add this block after the `llama` section (after line 28, before `matrix`):**
```javascript
  chatterbox: {
    grpcHost: process.env.CHATTERBOX_GRPC_HOST || 'localhost',
    grpcPort: parseInt(process.env.CHATTERBOX_GRPC_PORT) || 50051,
    speakerFile: process.env.CHATTERBOX_SPEAKER_FILE || null,
    temperature: parseFloat(process.env.CHATTERBOX_TEMPERATURE) || 0.8,
    topP: parseFloat(process.env.CHATTERBOX_TOP_P) || 0.95,
    topK: parseInt(process.env.CHATTERBOX_TOP_K) || 1000,
  },
```

**Verify:**
- File is valid JavaScript (no syntax errors)
- `chatterbox` section exists with all 6 properties: grpcHost, grpcPort, speakerFile, temperature, topP, topK
- Each property reads from the corresponding environment variable with correct defaults
- Default values match: host='localhost', port=50051, speakerFile=null, temp=0.8, topP=0.95, topK=1000

---

### 4.2 — Add Chatterbox environment variables to .env (or .env.example)

**File path:** `/home/jon/git/llm_server/.env` (if it exists) or `/home/jon/git/llm_server/.env.example` (if `.env` does not exist)

**Action:** After line 35 (`LLAMA_TIMEOUT=30000`), add the following 6 lines:

```env
# Chatterbox TTS Configuration
CHATTERBOX_GRPC_HOST=localhost
CHATTERBOX_GRPC_PORT=50051
CHATTERBOX_SPEAKER_FILE=/path/to/speaker_reference.wav
CHATTERBOX_TEMPERATURE=0.8
CHATTERBOX_TOP_P=0.95
CHATTERBOX_TOP_K=1000
```

**Important notes:**
- Replace `/path/to/speaker_reference.wav` with an actual WAV file path, or leave it as a placeholder if you don't have one yet (Chatterbox will use its builtin voice)
- The `TTS_SPEAKER_FILE` line from the old config is NOT removed — it's simply unused now. Do not delete it to avoid confusion.
- If `.env` does not exist, update `.env.example` instead and create a copy as `.env` for local development.

**Verify:**
- All 6 environment variables are present in `.env` (or `.env.example` if `.env` doesn't exist)
- Variable names match exactly: `CHATTERBOX_GRPC_HOST`, `CHATTERBOX_GRPC_PORT`, `CHATTERBOX_SPEAKER_FILE`, `CHATTERBOX_TEMPERATURE`, `CHATTERBOX_TOP_P`, `CHATTERBOX_TOP_K`
- Values are reasonable defaults (localhost, 50051, valid path or placeholder, 0.8, 0.95, 1000)

---

## Phase 4 Completion Checklist

Before moving to Phase 5, verify all of the following:

- [ ] `src/config/database.js` contains `chatterbox` section with 6 properties
- [ ] All 6 config properties read from correct env vars with correct defaults
- [ ] `.env` contains all 6 `CHATTERBOX_*` environment variables
- [ ] `CHATTERBOX_GRPC_HOST=localhost`
- [ ] `CHATTERBOX_GRPC_PORT=50051`
- [ ] `CHATTERBOX_SPEAKER_FILE` points to a WAV file or placeholder path
- [ ] `CHATTERBOX_TEMPERATURE=0.8`
- [ ] `CHATTERBOX_TOP_P=0.95`
- [ ] `CHATTERBOX_TOP_K=1000`
- [ ] No syntax errors in `database.js` (can verify with `node -c src/config/database.js`)
