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
