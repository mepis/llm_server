# Implementation Plan: Migrate TTS from llama.cpp Voice Model to Chatterbox Turbo

## Prerequisites

- Python 3.10+ installed on the server
- CUDA-capable GPU with ≥4GB VRAM
- pip available for Python dependency management
- Node.js ≥24.12.0 (already required by project)

---

## Phase 1: Create Chatterbox Microservice Directory Structure

### Step 1.1 — Create directory and files

```bash
mkdir -p /home/jon/git/llm_server/src/services/chatterbox
touch /home/jon/git/llm_server/src/services/chatterbox/__init__.py
```

### Step 1.2 — Create `src/services/chatterbox/tts.proto`

**File**: `/home/jon/git/llm_server/src/services/chatterbox/tts.proto`

```protobuf
syntax = "proto3";

package tts;

// TTSService provides text-to-speech generation using Chatterbox Turbo model.
service TTSService {
  // GenerateSpeech converts text to speech audio.
  rpc GenerateSpeech (TtsRequest) returns (TtsResponse);
  
  // HealthCheck verifies the gRPC service is operational.
  rpc HealthCheck (HealthCheckRequest) returns (HealthCheckResponse);
}

message TtsRequest {
  // Text to synthesize into speech. Max 2000 characters.
  string text = 1;
  
  // Sampling temperature (0.05–2.0). Default: 0.8.
  double temperature = 2;
  
  // Nucleus sampling threshold (0.0–1.0). Default: 0.95.
  double top_p = 3;
  
  // Top-k sampling parameter. Default: 1000.
  int32 top_k = 4;
  
  // Optional WAV audio bytes for voice cloning (max 5MB).
  // If provided, extracts speaker embedding and uses it for cloning.
  bytes speaker_audio = 5;
}

message TtsResponse {
  // Base64-encoded 16-bit PCM WAV audio at 24kHz sample rate, mono channel.
  string audio_base64 = 1;
  
  // Approximate audio duration in milliseconds.
  int32 duration_ms = 2;
}

message HealthCheckRequest {}

message HealthCheckResponse {
  enum ServingStatus {
    UNKNOWN = 0;
    SERVING = 1;
    NOT_SERVING = 2;
  }
  ServingStatus status = 1;
}
```

### Step 1.3 — Create `src/services/chatterbox/requirements.txt`

**File**: `/home/jon/git/llm_server/src/services/chatterbox/requirements.txt`

```
chatterbox-tts>=0.1.0
grpcio>=1.60.0
grpcio-tools>=1.60.0
torchaudio>=2.6.0
torch>=2.6.0
librosa>=0.10.0
numpy>=1.26.0
```

### Step 1.4 — Create `src/services/chatterbox/gen_grpc.sh`

**File**: `/home/jon/git/llm_server/src/services/chatterbox/gen_grpc.sh`

```bash
#!/bin/bash
# Compiles tts.proto to Python and Node.js gRPC stubs.
# Run from repo root: bash src/services/chatterbox/gen_grpc.sh

set -e

PROTO_DIR="src/services/chatterbox"
PYTHON_OUT="$PROTO_DIR"
NODE_OUT="src/services/chatterbox/grpc"

mkdir -p "$NODE_OUT"

# Generate Python stubs
python3 -m grpc_tools.protoc \
  -I"$PROTO_DIR" \
  --python_out="$PYTHON_OUT" \
  --grpc_python_out="$PYTHON_OUT" \
  "$PROTO_DIR/tts.proto"

echo "Python stubs generated: $PYTHON_OUT/tts_pb2.py, $PYTHON_OUT/tts_pb2_grpc.py"

# Generate Node.js stubs using @grpc/proto-loader
npx proto-loader-gen-types \
  --longs=String \
  --enums=String \
  --defaults \
  --oneofs \
  --grpcLib=@grpc/grpc-js \
  --outDir="$NODE_OUT" \
  "$PROTO_DIR/tts.proto"

echo "Node.js stubs generated: $NODE_OUT/"
```

Make it executable:
```bash
chmod +x /home/jon/git/llm_server/src/services/chatterbox/gen_grpc.sh
```

### Step 1.5 — Create `src/services/chatterbox/start.sh`

**File**: `/home/jon/git/llm_server/src/services/chatterbox/start.sh`

```bash
#!/bin/bash
# Starts the Chatterbox TTS gRPC service.
# Usage: bash src/services/chatterbox/start.sh [port]
# Default port: 50051

set -e

PORT="${1:-50051}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")/.."

echo "[chatterbox] Starting TTS gRPC service on port $PORT..."

python3 -c "
import sys, os, torch, subprocess

# Check Python version
if sys.version_info < (3, 10):
    print('ERROR: Python >= 3.10 required', file=sys.stderr)
    sys.exit(1)

# Check CUDA availability
if not torch.cuda.is_available():
    print('WARNING: CUDA not available. Chatterbox requires a GPU.', file=sys.stderr)
    print('         Speech generation will be extremely slow or fail.', file=sys.stderr)

# Install dependencies if not already installed
try:
    import chatterbox.tts_turbo
    import grpc
except ImportError:
    print('[chatterbox] Installing dependencies...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', os.path.join(os.path.dirname(__file__), 'requirements.txt')])

# Run the service
exec([sys.executable, os.path.join(os.path.dirname(__file__), 'tts_service.py'), str(PORT)])
"
```

Make it executable:
```bash
chmod +x /home/jon/git/llm_server/src/services/chatterbox/start.sh
```

---

## Phase 2: Implement Python gRPC Server

### Step 2.1 — Create `src/services/chatterbox/tts_service.py`

**File**: `/home/jon/git/llm_server/src/services/chatterbox/tts_service.py`

This is the core service file. It must:

1. Parse command-line port argument (default 50051)
2. Load ChatterboxTurboTTS model on startup
3. Preload speaker embedding if `CHATTERBOX_SPEAKER_FILE` env var is set
4. Implement `GenerateSpeech` and `HealthCheck` RPCs
5. Handle WAV encoding to base64

```python
#!/usr/bin/env python3
"""Chatterbox Turbo TTS gRPC service server."""

import os
import sys
import base64
import io
import logging
import argparse
from typing import Optional

import numpy as np
import torch
import torchaudio
import librosa
import grpc

# Import generated protobuf stubs
sys.path.insert(0, os.path.dirname(__file__))
import tts_pb2
import tts_pb2_grpc

from chatterbox.tts_turbo import ChatterboxTurboTTS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[chatterbox] %(asctime)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('chatterbox-tts')

# Constants
MAX_TEXT_LENGTH = 2000
MAX_SPEAKER_AUDIO_SIZE = 5 * 1024 * 1024  # 5MB
OUTPUT_SAMPLE_RATE = 24000


class TTSServiceImpl(tts_pb2_grpc.TTSServiceServicer):
    """Implementation of the TTSService gRPC service."""

    def __init__(self, speaker_audio_path: Optional[str] = None):
        self.model: Optional[ChatterboxTurboTTS] = None
        self.speaker_embedding: Optional[np.ndarray] = None
        self._load_model()
        if speaker_audio_path and os.path.exists(speaker_audio_path):
            self._load_speaker_embedding(speaker_audio_path)

    def _load_model(self):
        """Load the Chatterbox Turbo TTS model."""
        logger.info("Loading ChatterboxTurboTTS model...")
        try:
            self.model = ChatterboxTurboTTS.from_pretrained(device="cuda")
            logger.info(f"Model loaded successfully. VRAM usage: {torch.cuda.memory_allocated() / 1024**2:.1f} MB")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _load_speaker_embedding(self, audio_path: str):
        """Precompute speaker embedding from reference audio."""
        logger.info(f"Loading speaker embedding from: {audio_path}")
        try:
            # Chatterbox uses embed_ref() to precompute embeddings for production
            from chatterbox.tts_turbo import embed_ref
            wav, sr = torchaudio.load(audio_path)
            # Resample if needed
            if sr != 16000:
                wav = torchaudio.functional.resample(wav, sr, 16000)
            # Normalize to mono if stereo
            if wav.shape[0] > 1:
                wav = wav.mean(dim=0, keepdim=True)
            embedding = embed_ref(wav.cpu())
            self.speaker_embedding = embedding.numpy()
            logger.info("Speaker embedding loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load speaker embedding: {e}")

    def _validate_request(self, request: tts_pb2.TtsRequest) -> Optional[str]:
        """Validate the TtsRequest. Returns error message or None if valid."""
        if not request.text or len(request.text.strip()) == 0:
            return "Text is required"
        if len(request.text) > MAX_TEXT_LENGTH:
            return f"Text exceeds maximum length of {MAX_TEXT_LENGTH} characters"
        if request.speaker_audio and len(request.speaker_audio) > MAX_SPEAKER_AUDIO_SIZE:
            return f"Speaker audio exceeds maximum size of {MAX_SPEAKER_AUDIO_SIZE} bytes"
        if not self.model:
            return "Model not loaded"
        return None

    def _encode_wav_to_base64(self, waveform: torch.Tensor, sample_rate: int = OUTPUT_SAMPLE_RATE) -> str:
        """Convert a PyTorch audio tensor to base64-encoded WAV bytes."""
        # Ensure mono and correct shape (1, samples)
        if waveform.dim() == 1:
            waveform = waveform.unsqueeze(0)

        # Use torchaudio save to BytesIO
        buffer = io.BytesIO()
        torchaudio.save(buffer, waveform, sample_rate, format="wav")
        buffer.seek(0)
        wav_bytes = buffer.read()
        return base64.b64encode(wav_bytes).decode('utf-8')

    def GenerateSpeech(self, request: tts_pb2.TtsRequest, context: grpc.ServicerContext) -> tts_pb2.TtsResponse:
        """Generate speech from text."""
        # Validate request
        error = self._validate_request(request)
        if error:
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(error)
            return tts_pb2.TtsResponse()

        text = request.text
        temperature = request.temperature if request.temperature > 0 else 0.8
        top_p = request.top_p if request.top_p > 0 else 0.95
        top_k = request.top_k if request.top_k > 0 else 1000

        try:
            # Prepare generation kwargs
            generate_kwargs = {
                'temperature': temperature,
                'top_p': top_p,
                'top_k': top_k,
            }

            # If speaker audio provided in request, use it inline for voice cloning
            if request.speaker_audio and len(request.speaker_audio) > 0:
                logger.info("Generating with voice cloning from provided audio")
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    tmp.write(request.speaker_audio)
                    tmp_path = tmp.name
                try:
                    generate_kwargs['audio_prompt_path'] = tmp_path
                    wav = self.model.generate(text, **generate_kwargs)
                finally:
                    os.unlink(tmp_path)
            elif self.speaker_embedding is not None:
                logger.info("Generating with preloaded speaker embedding")
                wav = self.model.generate(text, **generate_kwargs)
            else:
                logger.info("Generating with builtin voice")
                wav = self.model.generate(text, **generate_kwargs)

            # Encode to WAV and return
            audio_base64 = self._encode_wav_to_base64(wav)

            # Estimate duration from waveform length
            duration_ms = int(wav.shape[-1] / OUTPUT_SAMPLE_RATE * 1000)

            return tts_pb2.TtsResponse(
                audio_base64=audio_base64,
                duration_ms=duration_ms
            )

        except Exception as e:
            logger.error(f"Speech generation failed: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return tts_pb2.TtsResponse()

    def HealthCheck(self, request: tts_pb2.HealthCheckRequest, context: grpc.ServicerContext) -> tts_pb2.HealthCheckResponse:
        """Health check endpoint."""
        if self.model is not None:
            return tts_pb2.HealthCheckResponse(status=tts_pb2.HealthCheckResponse.ServingStatus.SERVING)
        else:
            return tts_pb2.HealthCheckResponse(status=tts_pb2.HealthCheckResponse.ServingStatus.NOT_SERVING)


def serve(port: int, speaker_file: Optional[str] = None):
    """Start the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    service_impl = TTSServiceImpl(speaker_audio_path=speaker_file)
    tts_pb2_grpc.add_TTSServiceServicer_to_server(service_impl, server)

    server.add_insecure_port(f'[::]:{port}')
    server.start()

    logger.info(f"Chatterbox TTS gRPC service started on port {port}")
    logger.info(f"Speaker file: {speaker_file or 'None (using builtin voice)'}")

    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        server.stop(0)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Chatterbox TTS gRPC Service')
    parser.add_argument('--port', type=int, default=50051, help='gRPC server port (default: 50051)')
    args = parser.parse_args()

    speaker_file = os.environ.get('CHATTERBOX_SPEAKER_FILE', None)
    serve(port=args.port, speaker_file=speaker_file)
```

### Step 2.2 — Compile gRPC stubs

Run from repo root:
```bash
cd /home/jon/git/llm_server && bash src/services/chatterbox/gen_grpc.sh
```

This will generate:
- `src/services/chatterbox/tts_pb2.py` (Python protobuf)
- `src/services/chatterbox/tts_pb2_grpc.py` (Python gRPC)
- `src/services/chatterbox/grpc/tts_pb2.js` (Node.js protobuf types)
- `src/services/chatterbox/grpc/tts_pb2_grpc.js` (Node.js gRPC stubs)

---

## Phase 3: Install Node.js gRPC Dependencies

### Step 3.1 — Add gRPC packages to package.json

Run from repo root:
```bash
cd /home/jon/git/llm_server && npm install @grpc/grpc-js @grpc/proto-loader
```

This adds two dependencies:
- `@grpc/grpc-js`: Pure JavaScript gRPC implementation for Node.js
- `@grpc/proto-loader`: Loads `.proto` files into protobuf message definitions

---

## Phase 4: Update Configuration

### Step 4.1 — Modify `src/config/database.js`

**File**: `/home/jon/git/llm_server/src/config/database.js`

Add a `chatterbox` section after the existing `llama` section (after line 28):

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

Full file structure after edit:
```javascript
require('dotenv').config();

const mongoose = require('mongoose');

// Configuration settings
module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  mongodb: { ... },        // lines 10-17
  jwt: { ... },            // lines 19-22
  llama: { ... },          // lines 24-28
  chatterbox: { ... },     // NEW: lines 30-37

  matrix: { ... },         // lines 39-44
  sessionTimeout: ...,     // line 45
  maxFileSize: ...         // line 46
};
```

### Step 4.2 — Update `.env` (or `.env.example`)

**File**: `/home/jon/git/llm_server/.env` (after line 35) or `/home/jon/git/llm_server/.env.example` if `.env` does not exist

Replace the existing `TTS_SPEAKER_FILE` line and add Chatterbox configuration:

```env
# Add after LLAMA_TIMEOUT=30000 (line 35):
CHATTERBOX_GRPC_HOST=localhost
CHATTERBOX_GRPC_PORT=50051
CHATTERBOX_SPEAKER_FILE=/path/to/speaker_reference.wav
CHATTERBOX_TEMPERATURE=0.8
CHATTERBOX_TOP_P=0.95
CHATTERBOX_TOP_K=1000
```

**Note**: `CHATTERBOX_SPEAKER_FILE` should point to a 5-10 second WAV audio clip for voice cloning. If not set, Chatterbox uses its builtin voice.

---

## Phase 4.5: Update llamaController.js for New TTS Flow

### Step 4.5.1 — Modify `src/controllers/llamaController.js`

**File**: `/home/jon/git/llm_server/src/controllers/llamaController.js`

The old `generateAudio` function passed `speakerFile` as a request parameter to the llama.cpp TTS code. The new Chatterbox-based implementation uses inline voice cloning via `speakerAudio` (base64 WAV bytes) instead.

**Action:** Update the `generateAudio` controller function:

```javascript
const generateAudio = async (req, res) => {
  try {
    const { text, speakerFile, speakerAudio, useGuideTokens } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const options = {};
    if (speakerAudio && typeof speakerAudio === 'string') {
      options.speakerAudio = speakerAudio;
    }

    const base64Wav = await llamaService.generateAudio(text, options);

    res.json({ success: true, data: base64Wav });
  } catch (error) {
    logger.error('TTS generation failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Key changes:**
- Added `speakerAudio` to destructured request body parameters
- Removed `speakerFile` and `useGuideTokens` from options (no longer used)
- Created `options` object that only includes `speakerAudio` when provided
- The `speakerAudio` value is base64-encoded WAV bytes sent from the frontend for inline voice cloning

**Verify:**
- Controller destructures `text`, `speakerFile`, `speakerAudio`, `useGuideTokens` from `req.body`
- Only `speakerAudio` is passed to `llamaService.generateAudio()` in options
- Old `speakerFile` and `useGuideTokens` parameters are still destructured (for backward compatibility) but not used

---

## Phase 5: Implement gRPC Client in llamaService.js

### Step 5.1 — Add gRPC client initialization and modify `generateAudio()`

**File**: `/home/jon/git/llm_server/src/services/llamaService.js`

Add these imports at the top of the file (after existing requires):

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { spawn } = require('child_process');
```

Add gRPC client variables after the cache variables (after line 7):

```javascript
// Chatterbox gRPC client
let chatterboxClient = null;
let chatterboxChildProcess = null;
const CHATTERBOX_PROTO_PATH = path.join(__dirname, '../services/chatterbox/tts.proto');
```

Add helper functions after the cache variables (after line 10):

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

function shutdownChatterboxService() {
  if (chatterboxChildProcess) {
    logger.info('Shutting down Chatterbox service...');
    chatterboxChildProcess.kill('SIGTERM');
    chatterboxChildProcess = null;
  }
  chatterboxClient = null;
}
```

Now replace the `generateAudio` function (lines 113-184). Find the entire existing `generateAudio` function and replace it with:

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

Update the module exports to include the new functions. Replace the existing `module.exports` at the end (lines 316-322) with:

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

---

## Phase 6: Update Server Lifecycle (server.js)

### Step 6.1 — Modify `src/server.js`

**File**: `/home/jon/git/llm_server/src/server.js`

Add import at the top (after line 10):

```javascript
const { spawnChatterboxService, initChatterboxClient, waitForChatterboxHealth, shutdownChatterboxService } = require('./services/llamaService');
```

Replace the `startServer` function (lines 52-64) with:

```javascript
const startServer = async () => {
  try {
    await db.connectDB();

    // Start Chatterbox TTS service
    logger.info('Initializing Chatterbox TTS service...');
    const serviceStarted = spawnChatterboxService();

    if (serviceStarted) {
      const healthy = await waitForChatterboxHealth();
      if (!healthy) {
        logger.warn('Chatterbox service failed to become healthy. TTS will not be available.');
      } else {
        initChatterboxClient();
      }
    } else {
      logger.warn('Failed to spawn Chatterbox service. TTS will not be available.');
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  shutdownChatterboxService();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  shutdownChatterboxService();
  process.exit(0);
});
```

---

## Phase 7: Testing Procedures

### Step 7.1 — Test Python service independently

```bash
cd /home/jon/git/llm_server/src/services/chatterbox
python3 tts_service.py --port=50051
```

Expected output:
```
[chatterbox] Loading ChatterboxTurboTTS model...
[chatterbox] Model loaded successfully. VRAM usage: ~4000 MB
[chatterbox] Chatterbox TTS gRPC service started on port 50051
```

### Step 7.2 — Test gRPC stubs work

Create a quick test script `src/services/chatterbox/test_grpc.py`:

```python
import grpc
import tts_pb2
import tts_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = tts_pb2_grpc.TTSServiceStub(channel)

# Health check
health = stub.HealthCheck(tts_pb2.HealthCheckRequest())
print(f"Health status: {health.status}")  # Should be SERVING (1)

# Generate speech
request = tts_pb2.TtsRequest(text="Hello, this is a test of the Chatterbox TTS system.")
response = stub.GenerateSpeech(request)
print(f"Audio length: {len(response.audio_base64)} bytes")
print(f"Duration: {response.duration_ms} ms")

channel.close()
```

Run it while the service is running to verify end-to-end.

### Step 7.3 — Test full stack integration

1. Start backend: `npm run dev` (from repo root)
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to chat view in browser
4. Send a message, then click the speaker button on the AI response
5. Verify audio plays correctly

---

## Phase 8: Cleanup and Documentation

### Step 8.1 — Verify old llama.cpp TTS code was removed

The old TTS helper functions (`fillHannWindow`, `processFrame`, `embdToAudio`, `encodeWav`) should have been removed during Phase 5.4. Verify they are NOT present in `llamaService.js`:

```bash
cd /home/jon/git/llm_server && grep -c "fillHannWindow\|processFrame\|embdToAudio\|encodeWav" src/services/llamaService.js || echo "Old TTS code removed: OK"
```

Expected result: `0` (no matches found). If any matches appear, delete those functions.

### Step 8.2 — Update AGENTS.md

Add a note in `AGENTS.md` under the "Gotchas" section:

```markdown
- **Chatterbox TTS** requires GPU and Python 3.10+. The service auto-starts with the backend. If TTS fails, check that CUDA is available and the Chatterbox process is running.
```

---

## File Summary

### New Files Created

| File | Lines (approx) | Purpose |
|------|---------------|---------|
| `src/services/chatterbox/tts.proto` | 35 | gRPC service definition |
| `src/services/chatterbox/requirements.txt` | 7 | Python dependencies |
| `src/services/chatterbox/gen_grpc.sh` | 28 | Compile proto to stubs |
| `src/services/chatterbox/start.sh` | 30 | Service startup script |
| `src/services/chatterbox/tts_service.py` | 140 | Python gRPC server |
| `src/services/chatterbox/__init__.py` | 0 | Python package marker |

### Files Generated (by gen_grpc.sh)

| File | Purpose |
|------|---------|
| `src/services/chatterbox/tts_pb2.py` | Python protobuf messages |
| `src/services/chatterbox/tts_pb2_grpc.py` | Python gRPC stubs |
| `src/services/chatterbox/grpc/tts_pb2.js` | Node.js protobuf types |
| `src/services/chatterbox/grpc/tts_pb2_grpc.js` | Node.js gRPC stubs |

### Files Modified

| File | Changes |
|------|---------|
| `src/config/database.js` | Add `chatterbox` config section |
| `.env` (or `.env.example`) | Add 6 Chatterbox environment variables |
| `src/controllers/llamaController.js` | Update `generateAudio()` to use `speakerAudio` for inline voice cloning |
| `src/services/llamaService.js` | Replace `generateAudio()` with gRPC call; add client init/shutdown functions |
| `src/server.js` | Add Chatterbox lifecycle management (spawn, health check, shutdown) |

### Files Unchanged

| File | Reason |
|------|--------|
| `src/routes/llama.js` | Route unchanged (`POST /api/llama/tts`) |
| `frontend/src/views/chat/ChatView.vue` | Same endpoint, same response format (base64 WAV string) |
| `frontend/package.json` | No frontend changes needed |

---

## Execution Order for Coding Agent

1. **Phase 1** — Create directory structure and all new files (proto, requirements, scripts)
2. **Phase 2** — Write Python gRPC server (`tts_service.py`)
3. **Phase 2.2** — Run `gen_grpc.sh` to compile stubs
4. **Phase 3** — Install `@grpc/grpc-js` and `@grpc/proto-loader` via npm
5. **Phase 4** — Edit `database.js` and `.env` (or `.env.example`)
6. **Phase 4.5** — Edit `llamaController.js` (update TTS flow for inline voice cloning)
7. **Phase 5** — Edit `llamaService.js` (add imports, gRPC client, replace generateAudio)
8. **Phase 6** — Edit `server.js` (add lifecycle management)
9. **Phase 7** — Run tests: Python service standalone → full stack integration
10. **Phase 8** — Cleanup and documentation updates

Each phase should complete successfully before proceeding to the next. If any step fails, stop and report the error rather than continuing.
