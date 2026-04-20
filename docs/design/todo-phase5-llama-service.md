# Phase 5: Implement gRPC Client in llamaService.js

## Goal
Replace the existing `generateAudio()` function (which uses llama.cpp voice model) with a gRPC client call to the Chatterbox Python service. Add helper functions for proto loading, client initialization, service spawning, health checking, and graceful shutdown.

**This is the most complex phase.** Follow each step carefully.

---

## Todo Items

### 5.1 — Add gRPC imports to llamaService.js

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Current file top (lines 1-3):**
```javascript
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/database');
```

**Action:** Add these four lines after line 3 (after the `config` import):
```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { spawn } = require('child_process');
```

**Verify:**
- All 7 require statements present at top of file (3 original + 4 new)
- `grpc`, `protoLoader`, `path`, and `spawn` are imported
- No duplicate imports (e.g., `path` is NOT already imported in this file — it IS imported in server.js but not here)

---

### 5.2 — Add gRPC client variables

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Current variables (lines 5-7):**
```javascript
let cachedModels = null;
let modelsCacheTime = null;
const CACHE_TTL = 60000;
```

**Action:** Add these lines after line 7 (after `CACHE_TTL`, before the `getModels` function which starts at line 9):
```javascript

// Chatterbox gRPC client
let chatterboxClient = null;
let chatterboxChildProcess = null;
const CHATTERBOX_PROTO_PATH = path.join(__dirname, '../services/chatterbox/tts.proto');
```

**Verify:**
- `chatterboxClient` variable declared (null initially)
- `chatterboxChildProcess` variable declared (null initially)
- `CHATTERBOX_PROTO_PATH` constant points to the proto file using `path.join(__dirname, '../services/chatterbox/tts.proto')`

---

### 5.3 — Add helper functions before getModels

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Action:** Insert the following 5 functions right before `const getModels = async () => {` (which is currently at line 9, but will be at a later line after step 5.2).

The insertion point is: **between the gRPC client variables (step 5.2) and the first existing function (`getModels`).**

**Function 1: `loadChatterboxProto()`**
```javascript
function loadChatterboxProto() {
  const packageDefinition = protoLoader.loadSync(CHATTERBOX_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  return protoDescriptor.tts;
}
```

**Function 2: `initChatterboxClient()`**
```javascript
function initChatterboxClient() {
  try {
    const ttsProto = loadChatterboxProto();
    const host = config.chatterbox.grpcHost;
    const port = config.chatterbox.grpcPort;

    chatterboxClient = new ttsProto.TTSService(
      `${host}:${port}`,
      grpc.credentials.createInsecure()
    );

    logger.info(`Chatterbox gRPC client initialized: ${host}:${port}`);
    return true;
  } catch (error) {
    logger.error(`Failed to initialize Chatterbox gRPC client: ${error.message}`);
    return false;
  }
}
```

**Function 3: `spawnChatterboxService()`**
```javascript
function spawnChatterboxService() {
  try {
    const serviceScript = path.join(__dirname, '../services/chatterbox/tts_service.py');
    const port = config.chatterbox.grpcPort;

    chatterboxChildProcess = spawn('python3', [serviceScript, `--port=${port}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CHATTERBOX_SPEAKER_FILE: config.chatterbox.speakerFile || '',
      },
    });

    chatterboxChildProcess.stdout.on('data', (data) => {
      logger.info(`[chatterbox] ${data.toString().trim()}`);
    });

    chatterboxChildProcess.stderr.on('data', (data) => {
      logger.error(`[chatterbox] ${data.toString().trim()}`);
    });

    chatterboxChildProcess.on('error', (error) => {
      logger.error(`Failed to start Chatterbox service: ${error.message}`);
    });

    chatterboxChildProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        logger.error(`Chatterbox service exited with code ${code} (signal: ${signal})`);
      }
      chatterboxClient = null;
    });

    logger.info('Chatterbox TTS service process spawned');
    return true;
  } catch (error) {
    logger.error(`Failed to spawn Chatterbox service: ${error.message}`);
    return false;
  }
}
```

**Function 4: `waitForChatterboxHealth()`**
```javascript
async function waitForChatterboxHealth(maxRetries = 30, retryDelayMs = 1000) {
  return new Promise((resolve) => {
    let retries = 0;

    const check = () => {
      if (!chatterboxClient) {
        resolve(false);
        return;
      }

      chatterboxClient.healthCheck({}, (err, response) => {
        if (err) {
          retries++;
          if (retries >= maxRetries) {
            logger.error(`Chatterbox service health check failed after ${maxRetries} attempts`);
            resolve(false);
          } else {
            logger.info(`Waiting for Chatterbox service... attempt ${retries}/${maxRetries}`);
            setTimeout(check, retryDelayMs);
          }
        } else if (response && (response.status === 1 || response.status === 'SERVING')) { // SERVING (number or string depending on proto-loader config)
          logger.info('Chatterbox service is healthy and ready');
          resolve(true);
        } else {
          retries++;
          if (retries >= maxRetries) {
            resolve(false);
          } else {
            setTimeout(check, retryDelayMs);
          }
        }
      });
    };

    check();
  });
}
```

**Function 5: `shutdownChatterboxService()`**
```javascript
function shutdownChatterboxService() {
  if (chatterboxChildProcess) {
    logger.info('Shutting down Chatterbox service...');
    chatterboxChildProcess.kill('SIGTERM');
    chatterboxChildProcess = null;
  }
  chatterboxClient = null;
}
```

**Verify:**
- All 5 functions are present: `loadChatterboxProto`, `initChatterboxClient`, `spawnChatterboxService`, `waitForChatterboxHealth`, `shutdownChatterboxService`
- `loadChatterboxProto()` uses `protoLoader.loadSync()` with correct options and returns `protoDescriptor.tts`
- `initChatterboxClient()` creates a new `ttsProto.TTSService` using config values for host/port
- `spawnChatterboxService()` spawns `python3 tts_service.py --port=...` with stdio pipes and env var forwarding
- `waitForChatterboxHealth()` polls healthCheck RPC up to 30 times with 1s delay, resolves true on SERVING (status===1)
- `shutdownChatterboxService()` sends SIGTERM to child process and nullifies both client and process variables
- All functions are placed between the gRPC client variables and the existing `getModels` function

---

### 5.4 — Replace the `generateAudio()` function

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Action:** Find the existing `generateAudio` function (currently lines 113-184). This is a large block containing text tokenization, llama.cpp completion calls, embedding retrieval, inverse STFT (`embdToAudio`), and WAV encoding (`encodeWav`). **Replace the entire function body** with:

```javascript
const generateAudio = async (text, options = {}) => {
  if (!chatterboxClient) {
    throw new Error('Chatterbox service not initialized. Ensure the gRPC service is running.');
  }

  const textToUse = typeof text === 'string' ? text.trim() : String(text);

  if (textToUse.length === 0) {
    throw new Error('Text cannot be empty');
  }

  const finalText = textToUse.length > 2000
    ? (() => { logger.warn(`Truncating text from ${textToUse.length} to 2000 characters`); return textToUse.substring(0, 2000); })()
    : textToUse;

  // NOTE: proto-loader with @grpc/grpc-js returns descriptor objects, NOT constructors.
  // Use plain JavaScript objects for request data — gRPC handles serialization automatically.
  const request = {
    text: finalText,
    temperature: options.temperature || config.chatterbox.temperature,
    top_p: options.topP || config.chatterbox.topP,
    top_k: options.topK || config.chatterbox.topK,
  };

  if (options.speakerAudio && typeof options.speakerAudio === 'string') {
    request.speaker_audio = Buffer.from(options.speakerAudio, 'base64');
  }

  return new Promise((resolve, reject) => {
    chatterboxClient.generateSpeech(request, (err, response) => {
      if (err) {
        logger.error(`Chatterbox gRPC error: ${err.details || err.message}`);
        reject(new Error(`TTS generation failed: ${err.details || err.message}`));
        return;
      }

      if (!response || !response.audio_base64) {
        reject(new Error('TTS generation returned no audio data'));
        return;
      }

      const durationMs = response.duration_ms || 0;
      logger.info(`TTS generated ${durationMs}ms of audio (${textToUse.length} chars)`);
      resolve(response.audio_base64);
    });
  });
};
```

**Critical:** Remove all the old helper functions below `generateAudio` that are no longer needed:
- `fillHannWindow()` — was a helper for Hann window generation
- `processFrame()` — was a helper for FFT frame processing
- `embdToAudio()` — was the inverse STFT converting embeddings to waveform
- `encodeWav()` — was encoding Float32 audio data to 16-bit PCM WAV bytes

These were llama.cpp-specific audio reconstruction functions. Delete them entirely (they are lines ~186-314 in the current file).

**Verify:**
- `generateAudio()` is now ~30 lines (not ~70 lines like the old version)
- Function checks for `chatterboxClient` existence before proceeding
- Function validates text is non-empty and truncates to 2000 chars max
- Function creates a `TtsRequest` with text, temperature, top_p, top_k from config or options
- Function returns a Promise that resolves with base64 audio string or rejects on error
- Old helper functions (`fillHannWindow`, `processFrame`, `embdToAudio`, `encodeWav`) are removed

---

### 5.5 — Update module.exports

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Current exports (near end of file):**
```javascript
module.exports = {
  getModels,
  getChatCompletions,
  chatWithTools,
  getEmbeddings,
  healthCheck,
  generateAudio,
};
```

**Action:** Add the new helper functions to exports:
```javascript
module.exports = {
  getModels,
  getChatCompletions,
  chatWithTools,
  getEmbeddings,
  healthCheck,
  generateAudio,
  initChatterboxClient,
  spawnChatterboxService,
  waitForChatterboxHealth,
  shutdownChatterboxService,
};
```

**Verify:**
- Exports include all 4 new functions: `initChatterboxClient`, `spawnChatterboxService`, `waitForChatterboxHealth`, `shutdownChatterboxService`
- All original exports still present

---

## Phase 5 Completion Checklist

Before moving to Phase 6, verify all of the following:

- [ ] File has 7 require statements at top (added grpc, protoLoader, path, spawn)
- [ ] gRPC client variables declared: `chatterboxClient`, `chatterboxChildProcess`, `CHATTERBOX_PROTO_PATH`
- [ ] `loadChatterboxProto()` function present and returns `protoDescriptor.tts`
- [ ] `initChatterboxClient()` function present, creates TTSService with config host/port
- [ ] `spawnChatterboxService()` function present, spawns python3 process with stdio pipes
- [ ] `waitForChatterboxHealth()` function present, polls up to 30 times for SERVING status
- [ ] `shutdownChatterboxService()` function present, sends SIGTERM and nullifies references
- [ ] `generateAudio()` replaced with gRPC-based implementation (~30 lines)
- [ ] Old llama.cpp TTS helper functions removed (fillHannWindow, processFrame, embdToAudio, encodeWav)
- [ ] module.exports includes all 4 new functions
- [ ] File passes syntax check: `node -c src/services/llamaService.js` returns no errors
