#!/usr/bin/env bash
set -euo pipefail

QDRANT_VERSION="1.12.0"
BIN_DIR="$(cd "$(dirname "$0")" && pwd)/qdrant"
BINARY_NAME="qdrant"
BINARY_PATH="${BIN_DIR}/${BINARY_NAME}"

if [[ -x "$BINARY_PATH" ]]; then
  echo "Qdrant binary already exists at $BINARY_PATH"
  echo "To reinstall, remove it first: rm $BINARY_PATH"
  exit 0
fi

mkdir -p "$BIN_DIR"

ARCH="$(uname -m)"
OS="$(uname -s)"

case "${ARCH}" in
  x86_64|amd64)  ARCH_SUFFIX="x86_64" ;;
  aarch64|arm64) ARCH_SUFFIX="aarch64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "${OS}" in
  Linux)  OS_SUFFIX="unknown-linux-gnu" ;;
  Darwin) OS_SUFFIX="apple-darwin" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

PACKAGE="qdrant-${ARCH_SUFFIX}-${OS_SUFFIX}"
URL="https://github.com/qdrant/qdrant/releases/download/v${QDRANT_VERSION}/${PACKAGE}.tar.gz"

echo "Downloading Qdrant v${QDRANT_VERSION} (${ARCH_SUFFIX}-${OS_SUFFIX})..."
echo "  From: $URL"

TMP_FILE="$(mktemp)"
curl -fsSL -o "$TMP_FILE" "$URL"

echo "Extracting..."
TMP_DIR="$(mktemp -d)"
tar -xzf "$TMP_FILE" -C "$TMP_DIR"

# The binary may be directly in the tar or in a subdirectory
FOUND_BIN="$(find "$TMP_DIR" -name "qdrant" -type f | head -1)"
if [[ -z "$FOUND_BIN" ]]; then
  echo "Error: Could not find qdrant binary in archive"
  rm -rf "$TMP_FILE" "$TMP_DIR"
  exit 1
fi

cp "$FOUND_BIN" "$BINARY_PATH"
chmod +x "$BINARY_PATH"
rm -rf "$TMP_FILE" "$TMP_DIR"

echo ""
echo "Qdrant v${QDRANT_VERSION} installed successfully!"
echo "  Binary: $BINARY_PATH"
echo ""
echo "To start Qdrant:"
echo "  $BINARY_PATH server --grpc-port 6334 --http-port 6333"
echo ""
echo "Or run in the background:"
echo "  nohup $BINARY_PATH server --grpc-port 6334 --http-port 6333 &"
