# Phase 8: Cleanup and Documentation

## Goal
Remove old llama.cpp TTS code from `llamaService.js`, update AGENTS.md with a note about Chatterbox requirements, and verify no stale references to the old `TTS_SPEAKER_FILE` configuration remain.

---

## Todo Items

### 8.1 — Remove old llama.cpp TTS helper functions from llamaService.js

**File path:** `/home/jon/git/llm_server/src/services/llamaService.js`

**Action:** Verify that the following functions are NOT present in the file. If they exist, delete them:

1. `fillHannWindow()` — was a helper for Hann window generation
2. `processFrame()` — was a helper for FFT frame processing
3. `embdToAudio()` — was the inverse STFT converting embeddings to waveform
4. `encodeWav()` — was encoding Float32 audio data to 16-bit PCM WAV bytes

**These were llama.cpp-specific audio reconstruction functions.** They are no longer needed because:
- Chatterbox outputs a PyTorch tensor directly
- `_encode_wav_to_base64()` in the Python service handles WAV encoding
- The Node.js `generateAudio()` function just passes through the base64 string

**Verify:**
- Search for each function name (`fillHannWindow`, `processFrame`, `embdToAudio`, `encodeWav`) — none should be found
- File size is reasonable (~100 lines, not ~320 lines)
- No orphaned code fragments remain from the old TTS implementation

---

### 8.2 — Update AGENTS.md with Chatterbox note

**File path:** `/home/jon/git/llm_server/AGENTS.md`

**Current "Gotchas" section (near end of file):**
```markdown
## Gotchas

- **argon2 v1.0.0** — `argon2.verify()` takes `{ hash, password }` object, NOT two arguments...
- **All API responses** wrap data in `{ success: true, data: ... }`...
- [other gotchas...]
```

**Action:** Add this new bullet point to the Gotchas section (after the first item or at the end):

```markdown
- **Chatterbox TTS** requires GPU and Python 3.10+. The service auto-starts with the backend. If TTS fails, check that CUDA is available and the Chatterbox process is running.
```

**Verify:**
- New bullet point present in Gotchas section
- Mentions GPU requirement, Python 3.10+ requirement, and auto-start behavior
- Mentions troubleshooting: check CUDA availability and Chatterbox process status

---

### 8.3 — Verify no stale TTS_SPEAKER_FILE references in code (not .env)

**Action:** Search all JavaScript files for references to `TTS_SPEAKER_FILE`:

```bash
cd /home/jon/git/llm_server && grep -r "TTS_SPEAKER_FILE" --include="*.js" src/
```

**Expected result:** Only a match in `src/config/database.js` is acceptable (the old `llama.ttsSpeakerFile` config entry kept for backward compatibility). No matches should appear in controllers, routes, or services.

**If you find unexpected matches:**
- Check if it's in a controller, route, or service that still references the old config
- Update the reference to use `config.chatterbox.speakerFile` instead
- If the file is no longer needed for any purpose, consider removing it

**Note:** `.env` file may still contain `TTS_SPEAKER_FILE` — this is acceptable as a leftover. Do not delete it from `.env` to avoid confusion. Only clean up JavaScript code references (except `database.js` which keeps the old config for backward compatibility).

**Verify:**
- `grep -r "TTS_SPEAKER_FILE" --include="*.js" src/` returns only `src/config/database.js` (or no results)
- If any unexpected matches found, they are updated or removed

---

### 8.4 — Final syntax verification

**Run these commands from repo root:**
```bash
cd /home/jon/git/llm_server
node -c src/server.js && echo "server.js: OK"
node -c src/services/llamaService.js && echo "llamaService.js: OK"
node -c src/config/database.js && echo "database.js: OK"
```

**Verify:**
- All three files pass syntax check without errors
- Output shows `OK` for each file

---

### 8.5 — Final integration smoke test

**Run these commands from repo root:**
```bash
# Kill any existing processes
pkill -f "node.*server.js" || true
pkill -f "tts_service.py" || true
pkill -f "vite" || true
sleep 2

# Start backend
npm run dev &
sleep 15

# Verify Chatterbox is running
curl -s http://localhost:3000/api/health | python3 -m json.tool
```

**Expected output from health check:**
```json
{
  "status": "ok",
  "timestamp": "2025-04-20T..."
}
```

**Check backend logs for Chatterbox startup messages:**
- `[chatterbox] Loading ChatterboxTurboTTS model...`
- `Model loaded successfully. VRAM usage: ~XXXX MB`
- `Chatterbox service is healthy and ready`
- `Server running on port 3000`

**Verify:**
- Backend starts cleanly without errors
- Chatterbox service spawns and becomes healthy
- Health endpoint returns `{ "status": "ok" }`
- No error messages in logs about missing modules, gRPC failures, or CUDA issues

---

## Phase 8 Completion Checklist

Before considering the migration complete, verify all of the following:

- [ ] Old llama.cpp TTS helper functions removed (fillHannWindow, processFrame, embdToAudio, encodeWav)
- [ ] `llamaService.js` file size is ~100 lines (not ~320 lines)
- [ ] AGENTS.md updated with Chatterbox gotcha note mentioning GPU, Python 3.10+, and auto-start
- [ ] No JavaScript code references to `TTS_SPEAKER_FILE` remain in `src/`
- [ ] All JS files pass syntax check: `node -c src/server.js`, `node -c src/services/llamaService.js`, `node -c src/config/database.js`
- [ ] Clean restart works: backend spawns Chatterbox, health check passes, no errors in logs
- [ ] Full stack smoke test passes (backend starts, Chatterbox healthy, /api/health returns ok)
