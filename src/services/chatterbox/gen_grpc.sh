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
