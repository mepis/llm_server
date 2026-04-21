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
