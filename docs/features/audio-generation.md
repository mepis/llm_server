tags: [audio-generation, tts, llama-integration]
role: [developer, ops]

# Audio Generation (TTS)

Text-to-speech audio generation powered by an external Qwen3-TTS server.

## Overview

The TTS feature converts text into base64-encoded WAV audio via an external HTTP service. The backend acts as a proxy — it validates input, forwards the request to the configured TTS server URL, and returns the audio data wrapped in the standard API response format.

**Base path:** `/api/llama`

## Configuration

TTS requires an external Qwen3-TTS server. Configure these environment variables:

| Variable | Description | Default |
|---|---|---|
| `TTS_SERVER_URL` | URL of the external TTS HTTP service (e.g. `http://localhost:8000`) | — |
| `TTS_TIMEOUT` | Request timeout in ms | 60000 |
| `TTS_DEFAULT_SPEAKER` | Default speaker identifier | — |
| `TTS_DEFAULT_LANGUAGE` | Default language code | — |

The Qwen3-TTS service requires GPU hardware and Python 3.9+. Reference implementation: `integrations/qwen3-tts/`.

If `TTS_SERVER_URL` is not set, TTS endpoints return an error: "TTS service not configured."

## API Endpoints

### Generate Audio

```
POST /api/llama/tts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | Text to convert to speech (max 2000 chars) |
| `speaker` | string | No | Speaker identifier from the speakers list |
| `speakerAudio` | string | No | Base64 audio sample for voice cloning |
| `language` | string | No | Language code override |

**Response:**

```json
{
  "success": true,
  "data": "<base64-encoded WAV audio>"
}
```

Text longer than 2000 characters is automatically truncated with a warning logged.

**Error responses:**

| Status | Condition |
|---|---|
| 400 | Missing or non-string text |
| 500 | TTS service error, unreachable, or truncation warning logged |

### List Speakers

```
GET /api/llama/tts/speakers
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    { "id": "speaker_1", "name": "Voice A" },
    { "id": "speaker_2", "name": "Voice B" }
  ]
}
```

**Error responses:**

| Status | Condition |
|---|---|
| 502 | TTS server unreachable |
| 500 | Other service error |

## Request Flow

```
+----------+       POST /tts        +----------------+      POST /tts      +------------+
| Frontend | ----------------------> | Backend (3000) | ------------------> | TTS Server |
|          |  { text, speaker }     |                |  audio_base64      | (GPU/Py)   |
|          | <-----------------------|                | <------------------ |            |
+----------+  { success, data }    +----------------+                    +------------+
```

## Speaker Selection Workflow

```
GET /api/llama/tts/speakers
        |
        v
+---------------+
| TTS Server    |
| /speakers     |
+---------------+
        |
        v
  Speaker list returned
        |
        +---> User selects speaker ID
        |           |
        v           v
  POST /api/llama/tts
  { text, speaker: "<id>" }
        |
        v
+-----------------+
| Validate input   |
| - text required  |
| - max 2000 chars |
+-----------------+
        |
        v
  Forward to TTS server with options
        |
        v
  Return base64 audio in standard response
```

## Implementation Details

- **Controller:** `src/controllers/llamaController.js` — `generateAudio()` function
- **Service:** `src/services/llamaService.js` — `generateAudio()`, `getSpeakers()`, `initTTSClient()`
- **Route:** `src/routes/llama.js` — mounted under `/api/llama`
- TTS client URL is initialized once at startup via `initTTSClient()`, which reads `config.tts.serverUrl`
- The service uses axios with the configured timeout for all TTS requests

## Related Pages

- [Llama.cpp Integration](../architecture/backend-services.md)
- [Config Management](./config-management.md) — TTS settings stored in Config model
- [API Reference](../api/llama-api.md)
