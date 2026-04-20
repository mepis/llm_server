# Phase 7: Testing Procedures

## Goal
Verify the Chatterbox TTS system works end-to-end through three test stages: Python service standalone, gRPC stub verification, and full stack integration via frontend speaker button.

---

## Todo Items

### 7.1 — Test Python service independently

**Run this command from repo root (`/home/jon/git/llm_server`):**
```bash
cd /home/jon/git/llm_server/src/services/chatterbox && python3 tts_service.py --port=50051 &
```

The `&` runs it in the background. To run in foreground (for closer observation), omit `&`.

**Expected output:**
```
[chatterbox] Loading ChatterboxTurboTTS model...
[chatterbox] Model loaded successfully. VRAM usage: ~4000 MB
[chatterbox] Chatterbox TTS gRPC service started on port 50051
[chatterbox] Speaker file: None (using builtin voice)
```

**If CHATTERBOX_SPEAKER_FILE is set in .env, you should also see:**
```
[chatterbox] Loading speaker embedding from: /path/to/speaker_reference.wav
[chatterbox] Speaker embedding loaded successfully
```

**Verify:**
- Service starts without Python import errors
- Model loads successfully (may take 10-30 seconds on first run as it downloads from HuggingFace)
- gRPC server binds to port 50051
- No errors in log output

**If you see errors:**
- `ModuleNotFoundError: No module named 'chatterbox'` → Run: `pip3 install -r src/services/chatterbox/requirements.txt`
- `CUDA not available` → Warning is acceptable; service will still start but speech generation will be slow
- `Port already in use` → Kill any process on port 50051, or use a different port

**Keep this terminal open — you need the service running for the next test.**

---

### 7.2 — Test gRPC stubs work with a quick Python client

**Run this command from repo root (`/home/jon/git/llm_server`):**
```bash
cd /home/jon/git/llm_server && python3 -c "
import sys, base64, io
sys.path.insert(0, 'src/services/chatterbox')
import grpc
import tts_pb2
import tts_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = tts_pb2_grpc.TTSServiceStub(channel)

# Health check (Python uses snake_case for RPC methods)
print('=== Health Check ===')
health = stub.health_check(tts_pb2.HealthCheckRequest())
print(f'Status: {health.status} (1=SERVING)')

# Generate speech
print()
print('=== Generate Speech ===')
request = tts_pb2.TtsRequest(text='Hello, this is a test of the Chatterbox TTS system.')
response = stub.generate_speech(request)
print(f'Audio base64 length: {len(response.audio_base64)} bytes')
print(f'Duration: {response.duration_ms} ms')

# Verify WAV format by decoding and checking header
audio_bytes = base64.b64decode(response.audio_base64)
if audio_bytes[:4] == b'RIFF' and audio_bytes[8:12] == b'WAVE':
    print('WAV format: VALID (RIFF+WAVE header confirmed)')
else:
    print(f'WAV format: INVALID (first 12 bytes: {audio_bytes[:12]})')

channel.close()
print()
print('All tests passed!')
"
```

**Expected output:**
```
=== Health Check ===
Status: 1 (1=SERVING)

=== Generate Speech ===
Audio base64 length: ~50000-200000 bytes (varies by text length)
Duration: ~1000-5000 ms (varies by text length)
WAV format: VALID (RIFF+WAVE header confirmed)

All tests passed!
```

**Verify:**
- Health check returns status 1 (SERVING)
- Speech generation completes without errors
- Audio base64 string is non-empty and reasonable length
- WAV header starts with `RIFF` and contains `WAVE` at bytes 8-12
- No exceptions or gRPC errors

**If tests fail:**
- Connection refused → Python service may have crashed; check terminal output
- Model not loaded → First run may still be downloading; wait and retry
- Invalid WAV header → Check `_encode_wav_to_base64()` in tts_service.py uses `torchaudio.save(..., format="wav")`

---

### 7.3 — Stop the standalone Python service

**Run this command:**
```bash
# Find and kill the background python process
pkill -f "tts_service.py" || true
```

**Verify:**
- No python processes running `tts_service.py` (`ps aux | grep tts_service` shows nothing)

---

### 7.4 — Test full stack integration via frontend speaker button

This test verifies the complete flow: Node.js → gRPC → Chatterbox → WAV response → Frontend audio playback.

**Step A: Start the backend server**
```bash
cd /home/jon/git/llm_server && npm run dev &
```

**Verify:**
- Server starts and prints `Server running on port 3000`
- Chatterbox service log appears: `[chatterbox] Loading ChatterboxTurboTTS model...`
- Health check message: `Chatterbox service is healthy and ready`
- No errors about gRPC connection failures

**Step B: Start the frontend dev server**
```bash
cd /home/jon/git/llm_server/frontend && npm run dev &
```

**Verify:**
- Vite dev server starts on port 5173
- Frontend accessible at `http://localhost:5173`

**Step C: Test through the browser**

1. Open `http://localhost:5173` in a browser
2. Log in with admin credentials (admin / admin123)
3. Navigate to the Chat view
4. Send a test message: "Hello, this is a TTS test."
5. Wait for the AI response to appear
6. Click the speaker button (volume icon) on the AI response message

**Expected behavior:**
- Speaker button shows active state (changes color/icon)
- Audio plays through browser speakers/headphones
- Speech sounds natural (not robotic like the old llama.cpp voice)
- After audio finishes, speaker button returns to inactive state
- No console errors in browser DevTools

**If something fails:**
- Console error `Chatterbox service not initialized` → Backend didn't spawn Chatterbox; check server logs
- Console error `TTS generation failed` → gRPC call failed; check if Python process is still running
- Audio doesn't play → WAV format issue; verify base64 decodes to valid RIFF/WAV
- Frontend 401/403 → Auth token expired; refresh page and log in again

---

### 7.5 — Test voice cloning (optional, if speaker file configured)

**If `CHATTERBOX_SPEAKER_FILE` is set in `.env`:**

1. Send a message through the chat
2. Click the speaker button on the AI response
3. Verify the voice sounds like the reference speaker (not the builtin voice)

**If you don't have a speaker file but want to test:**
- Set `CHATTERBOX_SPEAKER_FILE` to any 5-10 second WAV clip of clear speech
- Restart backend: kill `npm run dev`, then run it again
- Verify log shows: `Loading speaker embedding from: /your/path.wav`

---

## Phase 7 Completion Checklist

Before moving to Phase 8, verify all of the following:

- [ ] Python service starts standalone without errors
- [ ] Model loads successfully (ChatterboxTurboTTS from_pretrained completes)
- [ ] gRPC server binds to port 50051
- [ ] Health check RPC returns SERVING (status=1)
- [ ] Speech generation RPC returns non-empty base64 audio
- [ ] Decoded audio has valid RIFF/WAV header
- [ ] Backend server starts with Chatterbox auto-spawned and healthy
- [ ] Frontend dev server starts on port 5173
- [ ] Can log in and navigate to chat view
- [ ] Speaker button triggers audio playback successfully
- [ ] Audio sounds natural (improved quality vs old llama.cpp voice)
- [ ] No console errors in browser DevTools during TTS playback
- [ ] Backend logs show `TTS generated Xms of audio` messages
