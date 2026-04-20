# Phase 1: Create Chatterbox Microservice Directory Structure

## Goal
Create the `src/services/chatterbox/` directory with all scaffold files: proto definition, Python requirements, gRPC compilation script, and service startup script.

---

## Todo Items

### 1.1 — Create directory structure

**Run this command:**
```bash
mkdir -p /home/jon/git/llm_server/src/services/chatterbox
touch /home/jon/git/llm_server/src/services/chatterbox/__init__.py
```

**Verify:**
- `ls src/services/chatterbox/` shows `__init__.py`
- Directory exists and is writable

---

### 1.2 — Create `src/services/chatterbox/tts.proto`

**File path:** `/home/jon/git/llm_server/src/services/chatterbox/tts.proto`

**Action:** Write the following content to the file:

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

**Verify:**
- File exists and is non-empty
- Contains `service TTSService` definition with both `GenerateSpeech` and `HealthCheck` RPCs
- Contains `TtsRequest` message with fields: text, temperature, top_p, top_k, speaker_audio
- Contains `TtsResponse` message with fields: audio_base64, duration_ms

---

### 1.3 — Create `src/services/chatterbox/requirements.txt`

**File path:** `/home/jon/git/llm_server/src/services/chatterbox/requirements.txt`

**Action:** Write the following content to the file:

```
chatterbox-tts>=0.1.0
grpcio>=1.60.0
grpcio-tools>=1.60.0
torchaudio>=2.6.0
torch>=2.6.0
librosa>=0.10.0
numpy>=1.26.0
```

**Verify:**
- File exists and is non-empty
- Contains all 7 dependencies listed above
- No extra blank lines or comments

---

### 1.4 — Create `src/services/chatterbox/gen_grpc.sh`

**File path:** `/home/jon/git/llm_server/src/services/chatterbox/gen_grpc.sh`

**Action:** Write the following content to the file:

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

**Make it executable:**
```bash
chmod +x /home/jon/git/llm_server/src/services/chatterbox/gen_grpc.sh
```

**Verify:**
- File exists and is non-empty
- File is executable (`ls -la src/services/chatterbox/gen_grpc.sh` shows `+x`)
- Contains `python3 -m grpc_tools.protoc` command for Python stub generation
- Contains `npx proto-loader-gen-types` command for Node.js stub generation

---

### 1.5 — Create `src/services/chatterbox/start.sh`

**File path:** `/home/jon/git/llm_server/src/services/chatterbox/start.sh`

**Action:** Write the following content to the file:

```bash
#!/bin/bash
# Starts the Chatterbox TTS gRPC service.
# Usage: bash src/services/chatterbox/start.sh [port]
# Default port: 50051

set -e

PORT="${1:-50051}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[chatterbox] Starting TTS gRPC service on port $PORT..."

# Check Python version
python3 -c "import sys; assert sys.version_info >= (3, 10), 'Python >= 3.10 required'" || { echo "ERROR: Python >= 3.10 required"; exit 1; }

# Check CUDA availability (warning only)
python3 -c "
import torch
if not torch.cuda.is_available():
    print('WARNING: CUDA not available. Chatterbox requires a GPU.', file=__import__('sys').stderr)
    print('         Speech generation will be extremely slow or fail.', file=__import__('sys').stderr)
" || true

# Install dependencies if not already installed
python3 -c "
try:
    import chatterbox.tts_turbo
    import grpc
except ImportError:
    print('[chatterbox] Installing dependencies...')
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', '${SCRIPT_DIR}/requirements.txt'])
"

# Run the service
exec python3 "${SCRIPT_DIR}/tts_service.py" --port="$PORT"
```

**Make it executable:**
```bash
chmod +x /home/jon/git/llm_server/src/services/chatterbox/start.sh
```

**Verify:**
- File exists and is non-empty
- File is executable (`ls -la src/services/chatterbox/start.sh` shows `+x`)
- Contains Python version check for 3.10+
- Contains CUDA availability check
- Contains pip install command referencing `requirements.txt` (uses `${SCRIPT_DIR}` correctly)
- Contains exec call to `tts_service.py` passing `--port` argument

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify all of the following:

- [ ] `src/services/chatterbox/` directory exists
- [ ] `__init__.py` file exists (can be empty)
- [ ] `tts.proto` contains service definition with GenerateSpeech and HealthCheck RPCs
- [ ] `requirements.txt` contains all 7 Python dependencies
- [ ] `gen_grpc.sh` is executable and contains protoc + proto-loader-gen-types commands
- [ ] `start.sh` is executable and contains version/CUDA checks + pip install + exec to tts_service.py
