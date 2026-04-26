tags: [llama, inference, streaming, embeddings, tts]
role: backend-developer

# Llama Service Functions

Documented from `src/services/llamaService.js`. The llama service handles all communication with the Llama.cpp inference server, including model listing, chat completions (with and without tools), embeddings, TTS, and health checks.

## Functions

- [getModels](./llama-service/getModels.md) - Fetches available models from the Llama.cpp server.
- [getChatCompletions](./llama-service/getChatCompletions.md) - Base completion endpoint.
- [chatWithTools](./llama-service/chatWithTools.md) - Chat completion with tool definitions.
- [streamChatWithTools](./llama-service/streamChatWithTools.md) - Streaming version of chat with tools.
- [getEmbeddings](./llama-service/getEmbeddings.md) - Creates embeddings via Llama.cpp.
- [healthCheck](./llama-service/healthCheck.md) - Verifies Llama.cpp server connectivity.
- [generateAudio](./llama-service/generateAudio.md) - Generates speech via Qwen3-TTS.
- [getSpeakers](./llama-service/getSpeakers.md) - Fetches available speakers.
- [initTTSClient](./llama-service/initTTSClient.md) - Initializes the TTS client.
- [shutdownTTS](./llama-service/shutdownTTS.md) - Disconnects the TTS client.

## TTS Functions (Grouped)

- [generateAudio](./llama-service/generateAudio.md)
- [getSpeakers](./llama-service/getSpeakers.md)
- [initTTSClient](./llama-service/initTTSClient.md)
- [shutdownTTS](./llama-service/shutdownTTS.md)

---
[Back to Index](../index.md)
