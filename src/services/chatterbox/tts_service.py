#!/usr/bin/env python3
"""Chatterbox Turbo TTS gRPC service server."""

import os
import sys
import base64
import io
import logging
import argparse
from typing import Optional
from concurrent import futures

import numpy as np
import torch
import torchaudio
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
        self.speaker_audio_path: Optional[str] = speaker_audio_path
        self._load_model()

    def _load_model(self):
        """Load the Chatterbox Turbo TTS model."""
        logger.info("Loading ChatterboxTurboTTS model...")
        try:
            self.model = ChatterboxTurboTTS.from_pretrained(device="cuda")
            logger.info(f"Model loaded successfully. VRAM usage: {torch.cuda.memory_allocated() / 1024**2:.1f} MB")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

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

            # If speaker audio provided in request, write to temp file and pass as audio_prompt_path
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

            # If a default speaker file was configured at startup, use it
            elif self.speaker_audio_path and os.path.exists(self.speaker_audio_path):
                logger.info(f"Generating with voice from configured reference: {self.speaker_audio_path}")
                generate_kwargs['audio_prompt_path'] = self.speaker_audio_path
                wav = self.model.generate(text, **generate_kwargs)

            # Otherwise use Chatterbox's built-in voice
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
