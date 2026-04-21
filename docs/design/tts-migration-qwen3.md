# Design Document: Replace Chatterbox TTS with Qwen3-TTS (External Service)

**Status:** Approved, pending implementation  
**Date:** 2026-04-21  
**Author:** opencode

---

## 1. Current Architecture

```
┌─────────────┐     POST /api/llama/tts      ┌──────────────────┐
│  Frontend    │ ──────────────────────────▶  │ Express Server    │
│ ChatView.vue │                              │ llamaController   │
└─────────────┘                              └────────┬─────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │ llamaService.js │
                                              │ gRPC client     │
                                              │ subprocess mgmt │
                                              └───────┬────────┘
                                                      │
                                              gRPC :50051
                                                      │
                                              ┌───────▼──────────┐
                                              │ Python subprocess│
                                              │ ChatterboxTurbo  │
                                              │ tts_service.py   │
                                              │ (CUDA, ~4GB VRAM)│
                                              └──────────────────┘
```

**Key characteristics:**

- gRPC service on port 50051, spawned as Node.js child process
- `ChatterboxTurboTTS` model loaded at startup on CUDA
- Three voice modes: builtin default, configured speaker file, per-request voice cloning
- Base64-encoded WAV output (24kHz, mono, 16-bit PCM)
- Text truncated to 2000 chars server-side
- Sampling params: temperature=0.8, top_p=0.95, top_k=1000
- Tightly coupled: Node.js manages lifecycle of Python subprocess

---

## 2. Target Architecture

```
                    ┌──────────────────────────────────────────┐
                    │       Separate Machine / Container        │
                    │                                           │
                    │   ┌─────────────┐     POST /tts           │
                    │   │ Qwen3-TTS   │ ◀───────────────────────│──┐
                    │   │ FastAPI     │    (external TTS server)│  │
                    │   │ CUDA:1.7B   │                         │  │
                    │   └─────────────┘                         │  │
                    └───────────────────────────────────────────┘  │
                                                                 │
┌─────────────┐     POST /api/llama/tts                          │
│  Frontend    │ ──────────────────────────▶  │ Express Server    │
│ ChatView.vue │                              │ llamaController   │
└─────────────┘                              └────────┬─────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │ llamaService.js │
                                              │ axios HTTP      │
                                              │ (no subprocess) │
                                              └───────┬────────┘
```

**Key changes:**

- Qwen3-TTS runs as an **independent server** on a separate machine/container
- All Qwen3-TTS source code lives in `./integrations/qwen3-tts/` (reference implementation)
- Node.js backend makes simple HTTP calls via axios — no subprocess management, no gRPC
- Same API contract: `POST /api/llama/tts` returns `{ success: true, data: "<base64 WAV>" }`
- TTS server URL configured via `.env` (e.g., `TTS_SERVER_URL=http://tts-server.local:50052`)

---

## 3. Qwen3-TTS Model Selection & Voice Modes

### Model: `Qwen/Qwen3-TTS-12Hz-1.7B-Base`

| Aspect        | Detail                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| Size          | 1.7B parameters, ~3.5GB VRAM at bfloat16                                       |
| Tokenizer     | 12Hz (12 tokens/sec), 16 codebooks, 2048 codebook size                         |
| Languages     | zh, en, de, it, pt, es, ja, ko, fr, ru                                         |
| Voice modes   | CustomVoice (preset speakers), VoiceDesign (text prompt), Base (voice cloning) |
| Default voice | **Ryan** (English male, dynamic/rhythmic)                                      |

### Voice Mode Mapping

| Current Chatterbox Mode                      | Qwen3-TTS Equivalent              | Implementation                                                             |
| -------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| Built-in default voice                       | CustomVoice with `speaker="Ryan"` | `generate_custom_voice(text, language="Auto", speaker="Ryan")`             |
| Configured speaker file (`TTS_SPEAKER_FILE`) | CustomVoice with preset speaker   | Load speaker name from env, use `generate_custom_voice()`                  |
| Per-request voice cloning (`speakerAudio`)   | Voice clone                       | `generate_voice_clone(text, language, ref_audio=decoded_wav, ref_text="")` |

### Speaker Preset Table

| Speaker  | Native Language   | Description                                       |
| -------- | ----------------- | ------------------------------------------------- |
| Vivian   | Chinese           | Bright, slightly edgy young female                |
| Serena   | Chinese           | Warm, gentle young female                         |
| Uncle_Fu | Chinese           | Seasoned male, low mellow timbre                  |
| Dylan    | Chinese (Beijing) | Youthful Beijing male                             |
| Eric     | Chinese (Sichuan) | Lively Chengdu male                               |
| **Ryan** | **English**       | **Dynamic male, strong rhythmic drive** ← default |
| Aiden    | English           | Sunny American male                               |
| Ono_Anna | Japanese          | Playful Japanese female                           |
| Sohee    | Korean            | Warm Korean female                                |

### Speaker Discovery Endpoint

The TTS service exposes `GET /speakers` to return the list of available preset speakers:

```python
@app.get("/speakers")
async def list_speakers():
    """Return available speaker presets."""
    return {
        "default": Config.DEFAULT_SPEAKER,
        "speakers": [
            {"name": "Ryan", "language": "English", "description": "Dynamic male, strong rhythmic drive"},
            {"name": "Aiden", "language": "English", "description": "Sunny American male"},
            {"name": "Vivian", "language": "Chinese", "description": "Bright, slightly edgy young female"},
            {"name": "Serena", "language": "Chinese", "description": "Warm, gentle young female"},
            {"name": "Uncle_Fu", "language": "Chinese", "description": "Seasoned male, low mellow timbre"},
            {"name": "Dylan", "language": "Chinese (Beijing)", "description": "Youthful Beijing male"},
            {"name": "Eric", "language": "Chinese (Sichuan)", "description": "Lively Chengdu male"},
            {"name": "Ono_Anna", "language": "Japanese", "description": "Playful Japanese female"},
            {"name": "Sohee", "language": "Korean", "description": "Warm Korean female"},
        ]
    }
```

This allows the frontend to populate a speaker selector dropdown. The backend can proxy this endpoint via `GET /api/llama/tts/speakers`.

---

## 4. Directory Structure

### `./integrations/qwen3-tts/` — Standalone TTS Service (Reference Implementation)

```
integrations/qwen3-tts/
├── tts_service.py          # FastAPI server wrapping Qwen3-TTS model
├── requirements.txt        # Python dependencies
├── start.sh                # Startup script (venv, install, launch)
└── README.md               # Deployment instructions for external hosting
```

### Files Removed from `src/services/chatterbox/`

All files in this directory are deleted during cleanup:

```
src/services/chatterbox/    ← DELETED ENTIRELY
├── tts_service.py          # Replaced by integrations/qwen3-tts/tts_service.py
├── tts.proto               # gRPC protobuf (no longer needed)
├── tts_pb2.py              # Generated Python stubs
├── tts_pb2_grpc.py         # Generated Python stubs
├── start.sh                # Replaced by integrations/qwen3-tts/start.sh
├── requirements.txt        # Replaced by integrations/qwen3-tts/requirements.txt
├── gen_grpc.sh             # gRPC codegen (no longer needed)
├── __init__.py             # Package marker
└── grpc/                   # Generated TypeScript stubs (no longer needed)
    ├── tts.ts
    ├── tts/
    │   ├── TtsRequest.ts
    │   ├── TtsResponse.ts
    │   ├── TTSService.ts
    │   ├── HealthCheckRequest.ts
    │   └── HealthCheckResponse.ts
```

---

## 5. File-by-File Change Spec

### 5.1 Created: `integrations/qwen3-tts/tts_service.py`

```python
#!/usr/bin/env python3
"""Qwen3-TTS FastAPI service for text-to-speech generation.

Designed to run as an independent server on a GPU-enabled machine.
Not spawned by the Node.js backend — runs separately ( systemd, etc.).
"""

import argparse
import base64
import io
import logging
import os
import tempfile
from typing import Optional

import numpy as np
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Qwen3-TTS imports
from qwen_tts import Qwen3TTSModel

logging.basicConfig(level=logging.INFO, format='[qwen-tts] %(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger('qwen-tts')


class Config:
    MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
    DEFAULT_SPEAKER = "Ryan"
    DEFAULT_LANGUAGE = "Auto"
    OUTPUT_SAMPLE_RATE = 24000
    MAX_TEXT_LENGTH = 2000

    # Available speakers for /speakers endpoint
    SPEAKERS = [
        {"name": "Ryan", "language": "English", "description": "Dynamic male, strong rhythmic drive"},
        {"name": "Aiden", "language": "English", "description": "Sunny American male"},
        {"name": "Vivian", "language": "Chinese", "description": "Bright, slightly edgy young female"},
        {"name": "Serena", "language": "Chinese", "description": "Warm, gentle young female"},
        {"name": "Uncle_Fu", "language": "Chinese", "description": "Seasoned male, low mellow timbre"},
        {"name": "Dylan", "language": "Chinese (Beijing)", "description": "Youthful Beijing male"},
        {"name": "Eric", "language": "Chinese (Sichuan)", "description": "Lively Chengdu male"},
        {"name": "Ono_Anna", "language": "Japanese", "description": "Playful Japanese female"},
        {"name": "Sohee", "language": "Korean", "description": "Warm Korean female"},
    ]


class TTSRequest(BaseModel):
    text: str
    speaker_audio: Optional[str] = None      # base64 WAV for voice cloning
    language: Optional[str] = "Auto"         # or specific language code (en, zh, etc.)
    speaker: Optional[str] = None            # preset speaker name (overrides default)


class TTSResponse(BaseModel):
    audio_base64: str
    duration_ms: int


app = FastAPI(title="Qwen3-TTS Service")

# Global model singleton — loaded once at startup
model: Optional[Qwen3TTSModel] = None


def _load_model():
    """Load Qwen3TTSModel on CUDA with bfloat16."""
    global model
    logger.info("Loading Qwen3-TTS model...")
    try:
        model = Qwen3TTSModel.from_pretrained(
            Config.MODEL_ID,
            device_map="cuda:0",
            dtype=torch.bfloat16,
            attn_implementation="flash_attention_2",
        )
    except (ImportError, RuntimeError):
        logger.warning("flash-attn not available or failed; loading without flash attention")
        model = Qwen3TTSModel.from_pretrained(
            Config.MODEL_ID,
            device_map="cuda:0",
            dtype=torch.bfloat16,
        )
    vram_used = torch.cuda.memory_allocated() / 1024**2
    logger.info(f"Model loaded. VRAM: {vram_used:.0f} MB")


def _encode_wav(waveform: np.ndarray, sample_rate: int) -> str:
    """Convert numpy waveform array to base64-encoded WAV bytes.

    Qwen3-TTS returns Tuple[List[numpy.ndarray], int] — not PyTorch tensors.
    """
    wav_int16 = (waveform * 32767).astype(np.int16)
    buffer = io.BytesIO()
    sf.write(buffer, wav_int16, sample_rate, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')


@app.post("/tts", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Generate speech from text.

    Voice modes:
      - No speaker_audio → CustomVoice (default: Ryan, or speaker field if provided)
      - With speaker_audio → Voice clone from reference WAV
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    text = request.text.strip()
    if len(text) == 0:
        raise HTTPException(status_code=400, detail="Text is required")
    if len(text) > Config.MAX_TEXT_LENGTH:
        logger.warning(f"Truncating text from {len(text)} to {Config.MAX_TEXT_LENGTH} chars")
        text = text[:Config.MAX_TEXT_LENGTH]

    try:
        # Voice clone mode (speaker audio provided)
        if request.speaker_audio:
            raw = base64.b64decode(request.speaker_audio)
            buf = io.BytesIO(raw)
            wav_data, sr = sf.read(buf, dtype='float32')
            tmp_path = tempfile.mktemp(suffix='.wav')
            sf.write(tmp_path, wav_data, sr, format="WAV", subtype="PCM_16")

            try:
                wavs, sr_out = model.generate_voice_clone(
                    text=text,
                    language=request.language or Config.DEFAULT_LANGUAGE,
                    ref_audio=tmp_path,  # accepts file path directly
                    ref_text="",
                    non_streaming_mode=True,  # explicit to match custom voice behavior
                )
            finally:
                os.unlink(tmp_path)

        # Custom voice mode (default speaker or specified speaker)
        else:
            selected_speaker = request.speaker or Config.DEFAULT_SPEAKER
            wavs, sr_out = model.generate_custom_voice(
                text=text,
                language=request.language or Config.DEFAULT_LANGUAGE,
                speaker=selected_speaker,
            )

        audio_base64 = _encode_wav(wavs[0] if isinstance(wavs, list) else wavs, sr_out)
        duration_ms = int(len(wavs[0] if isinstance(wavs, list) else wavs) / sr_out * 1000)

        return TTSResponse(audio_base64=audio_base64, duration_ms=duration_ms)

    except Exception as e:
        logger.error(f"Speech generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/speakers")
async def list_speakers():
    """Return available speaker presets.

    Uses the model's get_supported_speakers() instance method with
    hardcoded fallback if the model is unavailable or returns None.
    """
    speakers = []
    if model:
        try:
            speakers = model.get_supported_speakers() or []
        except Exception:
            pass  # fall through to hardcoded list
    return {
        "default": Config.DEFAULT_SPEAKER,
        "speakers": speakers if speakers else Config.SPEAKERS,
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    parser = argparse.ArgumentParser(description='Qwen3-TTS FastAPI Service')
    parser.add_argument('--port', type=int, default=50052, help='HTTP server port (default: 50052)')
    args = parser.parse_args()

    _load_model()
    uvicorn.run(app, host="0.0.0.0", port=args.port)
```

### 5.2 Created: `integrations/qwen3-tts/requirements.txt`

```
qwen-tts>=0.1.1
fastapi>=0.115.0
uvicorn>=0.34.0
torch>=2.5.0
torchaudio
soundfile
librosa
numpy
flash-attn  # optional — if unavailable, model loads without flash attention fallback
```

### 5.3 Created: `integrations/qwen3-tts/start.sh`

```bash
#!/bin/bash
# Starts the Qwen3-TTS FastAPI service as a standalone server.
# Usage: bash integrations/qwen3-tts/start.sh [port]
# Default port: 50052

set -e

PORT="${1:-50052}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${SCRIPT_DIR}/.venv"

echo "[qwen-tts] Starting TTS service on port $PORT..."

# Check Python version
python3 -c "import sys; assert sys.version_info >= (3, 9), 'Python >= 3.9 required'" || { echo "ERROR: Python >= 3.9 required"; exit 1; }

# Create virtual environment if it doesn't exist
USING_VENV=false
if [ ! -d "${VENV_DIR}" ]; then
    echo "[qwen-tts] Creating virtual environment..."
    python3 -m venv "${VENV_DIR}" && USING_VENV=true || {
        echo "[qwen-tts] WARNING: Failed to create venv. Using system Python with --break-system-packages."
    }
fi

# Activate virtual environment if created successfully
if [ "$USING_VENV" = true ] && [ -f "${VENV_DIR}/bin/activate" ]; then
    source "${VENV_DIR}/bin/activate"
    PIP_CMD="${VENV_DIR}/bin/pip"
    PYTHON_CMD="${VENV_DIR}/bin/python3"
else
    PIP_CMD="pip3"
    PYTHON_CMD="python3"
fi

# Install dependencies if not already installed
$PYTHON_CMD -c "
try:
    import qwen_tts
    import fastapi
except ImportError:
    print('[qwen-tts] Installing dependencies...')
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--break-system-packages', '-r', '${SCRIPT_DIR}/requirements.txt'])
"

# Check CUDA availability
$PYTHON_CMD -c "
import torch
if not torch.cuda.is_available():
    print('WARNING: CUDA not available. Qwen3-TTS requires a GPU.', file=__import__('sys').stderr)
" || true

# Run the service
exec $PYTHON_CMD "${SCRIPT_DIR}/tts_service.py" --port="$PORT"
```

### 5.4 Modified: `src/services/llamaService.js`

**Remove:** All gRPC imports and Chatterbox client code  
**Add:** Simple axios HTTP call to external TTS server

```javascript
// BEFORE (gRPC + subprocess management):
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { spawn } = require("child_process");
let chatterboxClient = null;
let chatterboxChildProcess = null;
const CHATTERBOX_PROTO_PATH = path.join(
  __dirname,
  "../services/chatterbox/tts.proto",
);

// 100+ lines of: loadChatterboxProto(), initChatterboxClient(), spawnChatterboxService(),
// waitForChatterboxHealth(), shutdownChatterboxService()

// AFTER (simple HTTP):
const axios = require("axios");

let ttsServiceUrl = null;

function initTTSClient() {
  ttsServiceUrl = config.tts.serverUrl; // e.g., http://tts-server.local:50052
  if (ttsServiceUrl) {
    logger.info(`TTS service URL configured: ${ttsServiceUrl}`);
  } else {
    logger.warn("No TTS server URL configured. TTS will be unavailable.");
  }
}

function shutdownTTS() {
  // No subprocess to manage — external server handles its own lifecycle
  ttsServiceUrl = null;
  logger.info("TTS client disconnected");
}

const generateAudio = async (text, options = {}) => {
  if (!ttsServiceUrl) {
    throw new Error("TTS service not configured. Set TTS_SERVER_URL in .env");
  }

  const finalText = text.length > 2000 ? text.substring(0, 2000) : text;

  const body = { text: finalText };
  if (options.speakerAudio) {
    body.speaker_audio = options.speakerAudio;
  }
  if (options.speaker) {
    body.speaker = options.speaker;
  }
  if (options.language) {
    body.language = options.language;
  }

  try {
    const response = await axios.post(`${ttsServiceUrl}/tts`, body, {
      timeout: config.tts.timeout || 60000,
    });
    return response.data.audio_base64;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `TTS service error (${error.response.status}): ${error.response.data.detail || error.message}`,
      );
    }
    throw new Error(`TTS service unreachable: ${error.message}`);
  }
};

const getSpeakers = async () => {
  if (!ttsServiceUrl) {
    throw new Error("TTS service not configured. Set TTS_SERVER_URL in .env");
  }
  const response = await axios.get(`${ttsServiceUrl}/speakers`, {
    timeout: config.tts.timeout || 60000,
  });
  return response.data;
};

module.exports = {
  // ... llama methods unchanged ...
  generateAudio,
  getSpeakers,
  initTTSClient,
  shutdownTTS,
};
```

### 5.5 Modified: `src/server.js`

**Remove:** All Chatterbox subprocess spawning and health checking  
**Keep:** MongoDB connection, Express setup

```javascript
// BEFORE (line 11):
const {
  spawnChatterboxService,
  initChatterboxClient,
  waitForChatterboxHealth,
  shutdownChatterboxService,
} = require("./services/llamaService");

// AFTER:
const { initTTSClient, shutdownTTS } = require("./services/llamaService");
```

**Remove lines 57-69 (Chatterbox startup block):**

```javascript
// BEFORE:
logger.info("Initializing Chatterbox TTS service...");
const serviceStarted = spawnChatterboxService();
if (serviceStarted) {
  initChatterboxClient();
  const healthy = await waitForChatterboxHealth();
  if (!healthy) {
    logger.warn(
      "Chatterbox service failed to become healthy. TTS will not be available.",
    );
  }
} else {
  logger.warn("Failed to spawn Chatterbox service. TTS will not be available.");
}

// AFTER:
initTTSClient();
logger.info("Server startup complete");
```

**Update shutdown handlers (lines 84-93):**

```javascript
// BEFORE:
process.on("SIGTERM", () => {
  shutdownChatterboxService();
  process.exit(0);
});
process.on("SIGINT", () => {
  shutdownChatterboxService();
  process.exit(0);
});

// AFTER:
process.on("SIGTERM", () => {
  shutdownTTS();
  process.exit(0);
});
process.on("SIGINT", () => {
  shutdownTTS();
  process.exit(0);
});
```

### 5.6 Modified: `src/config/database.js`

**Replace `chatterbox` block with `tts`, remove `llama.ttsSpeakerFile`:**

The current `database.js` has two speaker-related fields that must both be removed:

- `config.llama.ttsSpeakerFile` — reads `TTS_SPEAKER_FILE` env var (was added to `database.js` but never documented in `.env.example`)
- `config.chatterbox.speakerFile` — reads `CHATTERBOX_SPEAKER_FILE` env var (documented in `.env.example:26`)

Since Qwen3-TTS uses built-in speaker presets rather than external WAV files, both fields should be removed.

```javascript
// BEFORE:
llama: {
  url: process.env.LLAMA_SERVER_URL || 'http://localhost:8082',
  timeout: parseInt(process.env.LLAMA_TIMEOUT) || 30000,
  ttsSpeakerFile: process.env.TTS_SPEAKER_FILE || null,
},

chatterbox: {
  grpcHost: process.env.CHATTERBOX_GRPC_HOST || 'localhost',
  grpcPort: parseInt(process.env.CHATTERBOX_GRPC_PORT) || 50051,
  speakerFile: process.env.CHATTERBOX_SPEAKER_FILE || null,
  temperature: parseFloat(process.env.CHATTERBOX_TEMPERATURE) || 0.8,
  topP: parseFloat(process.env.CHATTERBOX_TOP_P) || 0.95,
  topK: parseInt(process.env.CHATTERBOX_TOP_K) || 1000,
}

// AFTER:
llama: {
  url: process.env.LLAMA_SERVER_URL || 'http://localhost:8082',
  timeout: parseInt(process.env.LLAMA_TIMEOUT) || 30000,
},

tts: {
  serverUrl: process.env.TTS_SERVER_URL || null,              // e.g., http://tts-server.local:50052
  timeout: parseInt(process.env.TTS_TIMEOUT) || 60000,        // axios timeout in ms
  speaker: process.env.TTS_DEFAULT_SPEAKER || 'Ryan',         // preset speaker name (Ryan, Aiden, Vivian, etc.)
  language: process.env.TTS_DEFAULT_LANGUAGE || 'Auto',       // default language (en, zh, Auto, etc.)
}
```

**Note:** `TTS_DEFAULT_SPEAKER` and `TTS_DEFAULT_LANGUAGE` are optional — the service defaults to "Ryan" and "Auto" respectively if unset. Only `TTS_SERVER_URL` is required for TTS to work.

### 5.7 Modified: `.env.example`

```bash
# BEFORE:
CHATTERBOX_GRPC_HOST=localhost
CHATTERBOX_GRPC_PORT=50051
CHATTERBOX_SPEAKER_FILE=/path/to/speaker_reference.wav
CHATTERBOX_TEMPERATURE=0.8
CHATTERBOX_TOP_P=0.95
CHATTERBOX_TOP_K=1000
# Note: TTS_SPEAKER_FILE was added to database.js but never documented in .env.example

# AFTER:
TTS_SERVER_URL=http://localhost:50052    # External TTS server URL (set to empty string to disable)
TTS_TIMEOUT=60000                         # HTTP request timeout in milliseconds
TTS_DEFAULT_SPEAKER=Ryan                  # Preset speaker name (optional, defaults to Ryan)
# TTS_DEFAULT_LANGUAGE=Auto               # Default language (en, zh, Auto — optional, defaults to Auto)
```

**Note:** Only `TTS_SERVER_URL` is required. `TTS_DEFAULT_SPEAKER` and `TTS_DEFAULT_LANGUAGE` are optional — the service uses "Ryan" and "Auto" as defaults when unset.

### 5.8 Modified: `package.json`

**Remove gRPC dependencies:**

```json
// REMOVE from dependencies:
"@grpc/grpc-js": "^1.14.3",
"@grpc/proto-loader": "^0.8.0",

// REMOVE from scripts:
"start:chatter": "cd src/services/chatterbox/ && ./start.sh",
```

### 5.9 Modified: `src/controllers/llamaController.js`

**Add `speaker` and `language` to TTS request handling:**

```javascript
// In generateAudio controller method — BEFORE:
const { text, speakerFile, speakerAudio, useGuideTokens } = req.body;

// AFTER:
const { text, speakerAudio, speaker, language } = req.body;

// Options building — BEFORE:
if (speakerAudio && typeof speakerAudio === "string") {
  options.speakerAudio = speakerAudio;
}

// AFTER:
if (speakerAudio && typeof speakerAudio === "string") {
  options.speakerAudio = speakerAudio;
}
if (speaker) {
  options.speaker = speaker;
}
if (language) {
  options.language = language;
}
```

### 5.10 Unchanged (No Modifications)

| File                                   | Reason                                                                                                                                                                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/llama.js`                  | Modified — adds `/tts/speakers` endpoint (see Section 5.11)                                                                                                                                                                                                                  |
| `frontend/src/views/chat/ChatView.vue` | Frontend TTS call — unchanged API contract. **Note:** only sends `{ text }`, no `speakerAudio`, `speaker`, or `language` fields — voice cloning and speaker selection not supported from UI. A speaker selector component could be added in a future enhancement if desired. |
| `frontend/src/stores/settings.js`      | `autoPlayTTS` setting — unchanged                                                                                                                                                                                                                                            |

### 5.11 Modified: `src/routes/llama.js` — Add `/speakers` endpoint

Add directly to the existing `llama.js` route file rather than creating a separate route file:

```javascript
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const llamaService = require("../services/llamaService");
const logger = require("../utils/logger");
const llamaController = require("../controllers/llamaController");

router.get("/models", authMiddleware, llamaController.getModels);
router.post(
  "/chat/completions",
  authMiddleware,
  llamaController.createChatCompletion,
);
router.post("/embeddings", authMiddleware, llamaController.createEmbedding);
router.post("/tts", authMiddleware, llamaController.generateAudio);
router.get("/tts/speakers", authMiddleware, async (req, res) => {
  try {
    const speakers = await llamaService.getSpeakers();
    res.json({ success: true, data: speakers });
  } catch (error) {
    logger.error(`Failed to fetch speakers: ${error.message}`);
    if (error.message.includes("unreachable")) {
      res.status(502).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});
router.get("/health", llamaController.getHealth);

module.exports = router;
```

No changes needed to `src/routes/api.js` — the `/speakers` endpoint mounts under the existing `/llama` route.

---

## 6. Implementation Phases

### Phase 1: Create Standalone TTS Service

**Goal:** Build and test `integrations/qwen3-tts/tts_service.py` as an independent server.

1. **Verify Qwen3-TTS library API** — **COMPLETED**: `qwen-tts>=0.1.1` confirmed on PyPI. Methods verified: `generate_custom_voice`, `generate_voice_clone`, `get_supported_speakers`. Return type is `Tuple[List[numpy.ndarray], int]` (not PyTorch tensors). See Section 5.1 for `_encode_wav` handling numpy arrays.
2. Create `integrations/qwen3-tts/` directory with all files:
   - `tts_service.py` — FastAPI server (code in Section 5.1 is final, no API changes needed)
   - `requirements.txt` — Python dependencies
   - `start.sh` — Startup script
3. Install dependencies and download Qwen3-TTS-12Hz-1.7B-Base model from HuggingFace
4. Test standalone:
   ```bash
   cd integrations/qwen3-tts && bash start.sh 50052
   curl http://localhost:50052/health → {"status": "ok"}
   curl -X POST http://localhost:50052/tts -d '{"text": "Hello world"}' → {audio_base64, duration_ms}
   curl http://localhost:50052/speakers → {default, speakers: [...]}
   ```
5. Test voice cloning with `speaker_audio` parameter

### Phase 2: Clean Up Chatterbox from Backend

**Goal:** Remove ALL Chatterbox/gRPC code from the Node.js backend.

1. Delete entire `src/services/chatterbox/` directory
2. Update `package.json`:
   - Remove `@grpc/grpc-js` and `@grpc/proto-loader` dependencies
   - Remove `start:chatter` script
3. Rewrite `src/services/llamaService.js`:
   - Remove all gRPC imports, protobuf loading, subprocess spawning
   - Replace with simple axios HTTP call to external TTS server
4. Update `src/server.js`:
   - Remove Chatterbox import line
   - Remove subprocess spawn/health check block from `startServer()`
   - Simplify shutdown handlers
5. Update `src/config/database.js`:
   - Replace `chatterbox` config block with `tts` block
   - Remove `llama.ttsSpeakerFile` (no longer relevant — Qwen3-TTS uses preset speakers)
6. Update `.env.example`:
   - Replace CHATTERBOX*\* vars with TTS*\* vars
7. Update active `.env`:
   - Remove all `CHATTERBOX_*` environment variables
   - Add `TTS_SERVER_URL`, `TTS_TIMEOUT`, and optionally `TTS_DEFAULT_SPEAKER`

### Phase 3: Integration Testing

**Goal:** Verify the complete TTS pipeline works end-to-end.

1. Start Qwen3-TTS service on a separate machine/container (or localhost):
   ```bash
   cd integrations/qwen3-tts && bash start.sh
   ```
2. Update `.env` with `TTS_SERVER_URL=http://<qwen3-tts-host>:50052`
3. Start backend (`npm run dev`) — should start without TTS errors, log TTS server URL configured
4. Test frontend:
   - Send a chat message, click speaker button → audio plays
   - Enable auto-play TTS → new assistant messages auto-spoken
   - **Limitation:** No speaker selector in UI; no voice cloning upload — both work only via direct API call (`POST /api/llama/tts` with `speakerAudio` field)
5. Test speakers endpoint: `GET /api/llama/tts/speakers` → returns preset list
6. Test voice cloning via direct API call (curl) — **no frontend UI support**
7. Verify graceful shutdown doesn't crash
8. **Rollback smoke test (optional):** Remove `integrations/qwen3-tts/`, restore `.env` with `CHATTERBOX_*` vars, re-add gRPC deps to package.json, restore `src/services/chatterbox/` from git, verify server starts correctly with Chatterbox — recommended only if backward compatibility is a requirement

### Phase 4: Documentation

**Goal:** Document the external TTS service deployment.

1. Update `docs/CHANGELOG.md` with timestamps for all changes per AGENTS.md convention
2. Create `integrations/qwen3-tts/README.md` with:
   - Hardware requirements (GPU, VRAM, Python version)
   - Installation steps
   - Deployment options ( systemd, direct)
   - Configuration options
   - API documentation (curl examples)
3. Update main repo README if needed

---

## 7. Error Handling

| Scenario                         | Behavior                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| `TTS_SERVER_URL` not set         | Warning logged at startup; TTS calls throw "not configured" error         |
| TTS server unreachable           | axios timeout (configurable); returns 502 with descriptive error          |
| TTS server returns HTTP error    | Error forwarded to frontend (400 for bad input, 500 for service error)    |
| Text > 2000 chars                | Truncated in Node.js before sending (same as Chatterbox)                  |
| Empty text                       | Validated in controller (400), never reaches TTS service                  |
| Qwen3-TTS model fails to load    | Service returns 503 on `/health`; backend logs warning                    |
| `/speakers` endpoint unreachable | Returns 502 with "TTS service unreachable" message                        |
| Invalid speaker name in request  | TTS service should return 400 (implement validation if Qwen3-TTS doesn't) |

### Network Resilience

Since the TTS server is now external:

- Backend does **not** retry — single axios call with timeout
- If TTS is down, frontend gets a clear error message
- User can disable TTS by clearing `TTS_SERVER_URL` in `.env`
- No lifecycle coupling — backend starts/fails independently of TTS server

### Sampling Parameters (Future)

Chatterbox exposed `temperature`, `top_p`, and `top_k` via env vars and request options. Qwen3-TTS may have equivalent sampling parameters. These could be exposed as new env vars (`TTS_TEMPERATURE`, etc.) or request body fields in a future enhancement. The current design does **not** expose them.

---

## 8. Testing Plan

### Qwen3-TTS Service Tests (Standalone)

```bash
# Test 1: Health endpoint
curl http://localhost:50052/health → {"status": "ok"}

# Test 2: Speakers endpoint
curl http://localhost:50052/speakers → {"default": "Ryan", "speakers": [...]}

# Test 3: Default voice generation
curl -X POST http://localhost:50052/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "English"}'
→ Verify response has audio_base64 field, duration_ms > 0

# Test 4: Custom speaker selection
curl -X POST http://localhost:50052/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "speaker": "Aiden"}'
→ Verify response has audio_base64 field

# Test 5: Voice cloning
curl -X POST http://localhost:50052/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Test clone", "speaker_audio": "<base64 wav>"}'
→ Verify response has audio_base64 field

# Test 6: Text truncation (2500 chars)
curl -X POST http://localhost:50052/tts \
  -d '{"text": "<2500 char string>"}'
→ Should truncate to 2000 chars without error

# Test 7: Empty text validation
curl -X POST http://localhost:50052/tts -d '{"text": ""}'
→ Should return 400 with error message
```

### Backend Integration Tests

```bash
# Start external TTS service first, then backend
export TTS_SERVER_URL=http://<host>:50052
npm run dev

# Test TTS API endpoint
curl -X POST http://localhost:3000/api/llama/tts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from backend", "speaker": "Ryan", "language": "en"}'
→ Should proxy to external TTS server and return result

# Test speakers endpoint
curl http://localhost:3000/api/llama/tts/speakers \
  -H "Authorization: Bearer <token>"
→ Should return { success: true, data: { default, speakers: [...] } }
```

### Frontend Tests

1. Open frontend, send a chat message
2. Click speaker button on AI response → audio plays
3. Toggle auto-play TTS in settings → verify behavior

---

## 9. Deployment Options for Qwen3-TTS Service

**DO NOT SUPPORT DOCKER**
The two options below are the **only** deployment options that will be supported.

### Option A: systemd Service

```ini
[Unit]
Description=Qwen3-TTS Service
After=network.target

[Service]
Type=simple
User=tts
WorkingDirectory=/opt/qwen3-tts
ExecStart=/opt/qwen3-tts/.venv/bin/python tts_service.py --port 50052
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Option B: Direct (Development)

```bash
cd integrations/qwen3-tts && bash start.sh
```

---

## 10. Rollback Plan

If issues arise with the new TTS service:

1. **Clean up new artifacts:** Delete `integrations/qwen3-tts/`, revert changes to `src/routes/llama.js` (remove `/tts/speakers` endpoint), remove updated config from `.env`
2. **Restore Chatterbox:** Restore `.env` with `CHATTERBOX_*` vars, re-add `@grpc/grpc-js` and `@grpc/proto-loader` to `package.json`, restore `src/services/chatterbox/` from git history, revert changes to `src/services/llamaService.js`, `src/server.js`, `src/config/database.js`, and `.env.example`
3. Run `npm install` to reinstall gRPC dependencies

---

## 11. Known Limitations & Gaps

| Item                            | Detail                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice cloning UI                | No frontend component for uploading reference audio; voice cloning works only via direct API call (`POST /api/llama/tts` with `speakerAudio` field)                                                                                                                                                      |
| Speaker selector UI             | No frontend dropdown for choosing from preset speakers; speaker selection works only via backend config (`TTS_DEFAULT_SPEAKER`) or future API parameter extension                                                                                                                                        |
| Qwen3-TTS library API           | **Verified** — `generate_custom_voice`, `generate_voice_clone`, `get_supported_speakers` confirmed in qwen-tts 0.1.1. Return types are `Tuple[List[numpy.ndarray], int]` (not PyTorch tensors). See Section 5.1 for updated `_encode_wav` handling.                                                      |
| `qwen-tts` package availability | **Confirmed** — `qwen-tts>=0.1.1` exists on PyPI and installs successfully. Dependencies include transformers 4.57.3, accelerate 1.12.0, librosa, torchaudio. Note: conflicts with existing `chatterbox-tts` which requires transformers==5.2.0 (resolved by separate venv).                             |
| Speaker preset mapping          | Mapping from Chatterbox's `CHATTERBOX_SPEAKER_FILE` (arbitrary WAV) to Qwen3-TTS presets is lossy — users with custom speaker files will need to choose from the built-in preset list. The `TTS_SPEAKER_FILE` env var (in `database.js:27`) was never documented in `.env.example` and should be removed |
| flash-attn fallback             | If `flash-attn` is not installed, model loads slower but functional; no error thrown                                                                                                                                                                                                                     |
| Sampling params lost            | Chatterbox exposed `temperature`, `top_p`, `top_k` via env vars. Qwen3-TTS may have equivalent params that could be exposed via new env vars (`TTS_TEMPERATURE`, etc.) in a future enhancement                                                                                                           |

---

## 12. Migration Checklist

- [x] **Phase 1: Verify Qwen3-TTS library** — COMPLETED: qwen-tts 0.1.1 confirmed, API verified (generate_custom_voice, generate_voice_clone, get_supported_speakers), return type is numpy arrays
- [ ] Create `integrations/qwen3-tts/tts_service.py` (code in Section 5.1 is final — no API adjustments needed)
- [ ] Create `integrations/qwen3-tts/requirements.txt`
- [ ] Create `integrations/qwen3-tts/start.sh`
- [ ] Test standalone Qwen3-TTS service (model download, voice modes, `/speakers` endpoint)
- [ ] Delete entire `src/services/chatterbox/` directory
- [ ] Remove `@grpc/grpc-js` and `@grpc/proto-loader` from `package.json` dependencies
- [ ] Remove `start:chatter` script from `package.json`
- [ ] Rewrite `src/services/llamaService.js` (remove gRPC, add HTTP)
- [ ] Add `/tts/speakers` endpoint to `src/routes/llama.js` (see Section 5.11 — no separate route file needed)
- [ ] Update `src/server.js` (remove Chatterbox startup/shutdown logic)
- [ ] Update `src/config/database.js` (`chatterbox` → `tts`, remove `llama.ttsSpeakerFile`)
- [ ] Add `language` field to new `tts` config block
- [ ] Update `.env.example` (`CHATTERBOX_*` → `TTS_*`, add `TTS_DEFAULT_SPEAKER`, `TTS_DEFAULT_LANGUAGE`)
- [ ] Update active `.env` (remove CHATTERBOX*\*, add TTS*\*)
- [ ] Test full stack integration (external TTS + backend + frontend)
- [ ] Test speakers endpoint (`GET /api/llama/tts/speakers`)
- [ ] Test voice cloning via direct API call (no UI support)
- [ ] **Rollback smoke test (optional):** restore Chatterbox from git, verify server starts — only if backward compatibility is a requirement
- [ ] Create `integrations/qwen3-tts/README.md`
- [ ] Update `docs/CHANGELOG.md` with timestamps
