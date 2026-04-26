tags: [llama, audio, tts]
role: backend-developer

# generateAudio(text, options)

Generates speech via an external Qwen3-TTS service. Requires `TTS_SERVER_URL` configured in `.env`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| text | String | Text to synthesize (max 2000 chars, longer text is truncated) |
| options | Object | Optional: `speaker`, `speakerAudio`, `language` |

**Returns:** Base64-encoded audio string (`audio_base64`).

**Throws:** Error if TTS service is not configured or unreachable. Returns HTTP error details from the TTS service (status code and detail message).

---
[Back to Llama Service Functions](./llama-service-functions.md)
