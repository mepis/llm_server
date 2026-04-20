# Design Document: Migrate TTS from llama.cpp Voice Model to Chatterbox Turbo

## Overview

Replace the current llama.cpp-based text-to-speech implementation with Resemble AI's Chatterbox Turbo TTS model via a Python gRPC microservice. This migration delivers significantly improved speech quality, natural-sounding output, and voice cloning capabilities while maintaining backward compatibility with the existing API contract.

**Status**: Draft  
**Author**: [Your Name]  
**Date**: 2025-04-20

---

## Problem Statement

The current TTS system uses llama.cpp's built-in voice model, which produces robotic, low-quality speech through a complex pipeline of text tokenization, speech code generation, embedding retrieval, and custom inverse STFT reconstruction. Users need natural-sounding voice responses for chat interactions and Matrix messaging.

---

## Goals

- Deliver human-like, natural-sounding speech quality
- Support zero-shot voice cloning from 5-10 second audio references
- Maintain identical API contract (`POST /api/llama/tts` → base64 WAV)
- Zero frontend changes required
- Provide graceful fallback during service downtime

## Non-Goals

- Voice conversion (ChatterboxVC) — out of scope for this migration
- Multilingual TTS — Chatterbox Turbo is English-only; multilingual can be added later
- Real-time streaming TTS — batch generation only (sufficient for chat use case)

---

## Architecture Decision: Python gRPC Microservice

### Decision

Run Chatterbox as a standalone Python gRPC service, with Node.js calling it via gRPC.

### Rationale

| Option                                | Pros                                                                               | Cons                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------- |
| **Python gRPC microservice** (chosen) | Clean separation, efficient binary serialization, easier GPU dependency management | Network hop adds latency (~1-5ms)           |
| Node.js child_process wrapper         | Single process deployment                                                          | Complex orchestration, shared memory issues |
| Direct Python import in Node          | Simplest code path                                                                 | No isolation, harder to upgrade TTS model   |

**gRPC chosen over HTTP/REST**: Binary protobuf serialization is ~3-10x more efficient for audio payloads than JSON+multipart. Lower latency for repeated calls. Strong typing of request/response contracts.

### Architecture Diagram

```
┌─────────────────────────────┐         gRPC (protobuf)         ┌──────────────────────────┐
│  Node.js Backend            │ ──────────────────────────────► │  Python Chatterbox       │
│                             │                                   | Service (GPU)          │
│  llamaService.generateAudio │                                   |                          │
│  POST /api/llama/tts        │                                   | ChatterboxTurboTTS       │
│  ChatView.vue speaker btn   │                                   | 350M params, 24kHz       │
└─────────────────────────────┘                                   └──────────────────────────┘
```

---

## Component Design

### 1. Chatterbox Microservice (`src/services/chatterbox/`)

#### Files to Create

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `tts.proto`        | gRPC service definition with message types                     |
| `tts_service.py`   | Python gRPC server, loads model, handles requests              |
| `requirements.txt` | Python dependencies (chatterbox-tts, grpcio, torchaudio, etc.) |
| `gen_grpc.sh`      | Compiles `.proto` to Python and Node.js gRPC stubs             |
| `start.sh`         | Startup script with dependency checks and health readiness     |

#### gRPC Service Definition (`tts.proto`)

```protobuf
syntax = "proto3";
package tts;

service TTSService {
  rpc GenerateSpeech (TtsRequest) returns (TtsResponse);
}

message TtsRequest {
  string text = 1;              // Required: text to synthesize (max 2000 chars)
  double temperature = 2;       // Optional: sampling temp, default 0.8
  double top_p = 3;             // Optional: nucleus sampling, default 0.95
  int32 top_k = 4;              // Optional: top-k, default 1000
  bytes speaker_audio = 5;      // Optional: WAV bytes for voice cloning (max 5MB)
}

message TtsResponse {
  string audio_base64 = 1;      // Base64-encoded 16-bit PCM WAV at 24kHz
  int32 duration_ms = 2;        // Approximate audio duration in milliseconds
}
```

#### Python Server Implementation (`tts_service.py`)

Key responsibilities:

- On startup: load `ChatterboxTurboTTS.from_pretrained(device="cuda")` from HuggingFace
- Precompute speaker embedding if `CHATTERBOX_SPEAKER_FILE` env var is set (via `embed_ref()`)
- Handle `GenerateSpeech` RPC:
  - If `speaker_audio` provided: decode WAV → extract speaker embedding → generate with cloning
  - Otherwise: generate with preloaded speaker embedding or builtin voice
  - Convert PyTorch tensor to base64-encoded WAV buffer (24kHz, 16-bit PCM, mono)
- Run on configurable host/port (default `localhost:50051`)
- Implement health check endpoint (`/grpc.health.v1.Health/Check`)

#### Dependencies (`requirements.txt`)

```
chatterbox-tts>=0.1.0
grpcio>=1.60.0
grpcio-tools>=1.60.0
torchaudio>=2.6.0
torch>=2.6.0
librosa>=0.10.0
numpy>=1.26.0
```

### 2. Node.js Integration (`src/services/llamaService.js`)

#### Changes to `generateAudio()` Method

Replace lines 113-184 in `llamaService.js` with gRPC call:

```javascript
// Replace all llama.cpp TTS code with:
const generateAudio = async (text, options = {}) => {
  if (!chatterboxClient) {
    throw new Error("Chatterbox service not initialized");
  }

  const request = new Chatterbox.TtsRequest();
  request.setText(text);
  request.setTemperature(options.temperature || config.chatterbox.temperature);
  request.setTopP(options.topP || config.chatterbox.topP);
  request.setTopK(options.topK || config.chatterbox.topK);

  if (options.speakerAudio) {
    request.setSpeakerAudio(Buffer.from(options.speakerAudio, "base64"));
  }

  const response = await new Promise((resolve, reject) => {
    chatterboxClient.generateSpeech(request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });

  return response.getAudioBase64();
};
```

#### gRPC Client Initialization

Add to `llamaService.js`:

- Import generated gRPC stubs (`grpc`, `@grpc/proto-loader`, `./chatterbox/tts_pb2_grpc`)
- Create client in module scope: `new Chatterbox.TTSService(grpcHost, grpcChannel, credentials)`
- Add health check function: `checkChatterboxHealth()` that pings the gRPC service
- Add retry logic with exponential backoff for transient failures

### 3. Configuration Updates

#### `src/config/database.js` — Add chatterbox section

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

#### `.env` — Add Chatterbox variables

```env
# Chatterbox TTS Configuration
CHATTERBOX_GRPC_HOST=localhost
CHATTERBOX_GRPC_PORT=50051
CHATTERBOX_SPEAKER_FILE=/path/to/speaker_reference.wav    # 5-10s WAV clip for voice cloning
CHATTERBOX_TEMPERATURE=0.8
CHATTERBOX_TOP_P=0.95
CHATTERBOX_TOP_K=1000
```

**Migration note**: `TTS_SPEAKER_FILE` (JSON format) is replaced by `CHATTERBOX_SPEAKER_FILE` (WAV format).

### 4. Server Lifecycle (`src/server.js`)

On startup, after MongoDB connection:

1. Spawn Chatterbox Python gRPC service process via `child_process.spawn()`
2. Wait for service readiness via health check polling (max 30 seconds)
3. Initialize gRPC client in llamaService
4. Proceed with Express server start

On shutdown (SIGTERM/SIGINT):

1. Close gRPC client
2. Terminate Chatterbox child process gracefully
3. Wait for cleanup before exiting

---

## Files Requiring NO Changes

| File                                   | Reason                                               |
| -------------------------------------- | ---------------------------------------------------- |
| `src/routes/llama.js`                  | Route unchanged (`POST /api/llama/tts`)              |
| `src/controllers/llamaController.js`   | Controller delegates to service, signature unchanged |
| `frontend/src/views/chat/ChatView.vue` | Same API endpoint, same base64 WAV response format   |
| `src/routes/api.js`                    | Route mounting unchanged                             |

---

## Migration Strategy

### Phase 1: Implement Chatterbox Microservice

- Create `src/services/chatterbox/` directory structure
- Implement gRPC service in Python
- Compile stubs for both Python and Node.js
- Test microservice independently with sample WAV generation

### Phase 2: Integrate into Node.js Backend

- Update `llamaService.js.generateAudio()` to use gRPC client
- Add configuration sections to `database.js`
- Add environment variables to `.env`
- Add Chatterbox lifecycle management to `server.js`

### Phase 3: Validation and Testing

- Verify TTS generation through full stack (API → frontend speaker button)
- Validate WAV output format matches frontend expectations (16-bit PCM, 24kHz, mono)
- Test voice cloning with reference audio clips
- Test paralinguistic tags (`[laugh]`, `[cough]`, `[chuckle]`)

### Phase 4: Cleanup (Post-Validation)

- Remove or comment out old llama.cpp TTS code in `llamaService.js`
- Update documentation references to TTS speaker configuration
- Add deployment instructions for Chatterbox service

---

## Configuration Reference

### Environment Variables

| Variable                  | Type   | Default     | Description                        |
| ------------------------- | ------ | ----------- | ---------------------------------- |
| `CHATTERBOX_GRPC_HOST`    | string | `localhost` | Host where gRPC service runs       |
| `CHATTERBOX_GRPC_PORT`    | int    | `50051`     | Port for gRPC service              |
| `CHATTERBOX_SPEAKER_FILE` | string | `null`      | Path to WAV reference clip (5-10s) |
| `CHATTERBOX_TEMPERATURE`  | float  | `0.8`       | Sampling temperature (0.05–2.0)    |
| `CHATTERBOX_TOP_P`        | float  | `0.95`      | Nucleus sampling threshold         |
| `CHATTERBOX_TOP_K`        | int    | `1000`      | Top-k sampling parameter           |

### WAV Reference File Requirements

- **Format**: 16-bit PCM WAV (any sample rate, service will resample if needed)
- **Duration**: 5–10 seconds of clear speech
- **Content**: Natural speech with varied intonation; avoid background noise
- **Size**: Maximum 5MB

---

## Risk Assessment and Mitigation

| Risk                                 | Severity | Mitigation                                                              |
| ------------------------------------ | -------- | ----------------------------------------------------------------------- |
| GPU unavailable or insufficient VRAM | High     | Require GPU in deployment docs; add hardware check on startup           |
| Chatterbox service fails to start    | Medium   | Add health check in `server.js`; log clear error message if unreachable |
| gRPC connection drops mid-request    | Low      | Implement retry with exponential backoff in llamaService                |
| Model download fails (first run)     | Medium   | Pre-download model via setup script or Docker layer; cache on disk      |
| WAV format mismatch with frontend    | Low      | Validate output format in tests: 24kHz, 16-bit PCM, mono                |
| Input text too long causes OOM       | Low      | Enforce max 2000 characters per request                                 |

---

## Testing Strategy

### Unit Tests (Chatterbox Service)

- Test gRPC service starts and responds to health checks
- Test WAV encoding produces valid format headers
- Test speaker audio extraction from reference clips

### Integration Tests (`src/services/llamaService.js`)

- Test `generateAudio()` returns base64 string for valid input
- Test error handling when Chatterbox service is unreachable
- Test voice cloning with provided speaker audio bytes

### E2E Tests (Playwright)

- Navigate to chat view and click speaker button on a message
- Verify audio plays successfully in browser
- Compare playback duration vs text length (sanity check)

---

## Deployment Notes

### Hardware Requirements

- **GPU**: CUDA-capable GPU with at least 4GB VRAM (8GB recommended)
- **CPU**: Any modern CPU (model loading is GPU-bound)
- **RAM**: 8GB minimum, 16GB recommended

### Model Download

First run downloads ~1.2GB from HuggingFace (`ResembleAI/chatterbox-turbo`):

- `t3_turbo_v1.safetensors` — T3 text-to-speech transformer
- `s3gen_meanflow.safetensors` — CFM speech generator (mean-flow mode)
- `ve.safetensors` — Voice encoder for speaker embeddings

### Deployment Options

The Chatterbox service can be deployed via:

1. **Systemd service**: Run as background daemon on the same host

---

## Future Enhancements (Out of Scope)

- Add multilingual model support (`ChatterboxMultilingualTTS`) for non-English responses
- Add streaming TTS via gRPC server-side streaming for real-time playback
- Add admin API to upload/manage voice reference clips per user
- Add Caching layer for frequently requested phrases to reduce GPU load
- Add quality metrics and usage analytics dashboard
