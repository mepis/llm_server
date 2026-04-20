# Phase 3: Install Node.js gRPC Dependencies and Compile Stubs

## Goal
Install the Node.js gRPC packages and compile the `.proto` file into Python stubs. The Node.js side uses runtime proto loading via `protoLoader.loadSync()` — no TypeScript compilation needed.

---

## Todo Items

### 3.1 — Install Node.js gRPC packages

**Run this command from repo root (`/home/jon/git/llm_server`):**
```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

**Verify:**
- `package.json` now contains both dependencies in the `dependencies` section:
  - `"@grpc/grpc-js": "^..."`
  - `"@grpc/proto-loader": "^..."`
- `node_modules/@grpc/grpc-js/` directory exists
- `node_modules/@grpc/proto-loader/` directory exists

---

### 3.2 — Compile Python gRPC stubs using gen_grpc.sh

**Run this command from repo root (`/home/jon/git/llm_server`):**
```bash
bash src/services/chatterbox/gen_grpc.sh
```

**Expected output:**
```
Python stubs generated: src/services/chatterbox/tts_pb2.py, src/services/chatterbox/tts_pb2_grpc.py
Node.js stubs generated: src/services/chatterbox/grpc/
```

Note: The Node.js TypeScript definition files are generated but not used at runtime. Node.js loads the proto file dynamically via `protoLoader.loadSync()` in Phase 5. You can safely ignore or delete the `src/services/chatterbox/grpc/` directory if desired.

**Verify:**
- `src/services/chatterbox/tts_pb2.py` exists (Python protobuf message definitions)
- `src/services/chatterbox/tts_pb2_grpc.py` exists (Python gRPC service stubs)
- `src/services/chatterbox/grpc/` directory was created (contains TypeScript defs, optional)

---

### 3.3 — Verify Python stubs can be imported

**Run this command from repo root:**
```bash
cd /home/jon/git/llm_server && python3 -c "import sys; sys.path.insert(0, 'src/services/chatterbox'); import tts_pb2; import tts_pb2_grpc; print('Python stubs OK')"
```

**Verify:**
- Command prints `Python stubs OK` without errors
- No import errors related to missing protobuf definitions

---

## Phase 3 Completion Checklist

Before moving to Phase 4, verify all of the following:

- [ ] `@grpc/grpc-js` installed in package.json and node_modules
- [ ] `@grpc/proto-loader` installed in package.json and node_modules
- [ ] `gen_grpc.sh` ran successfully without errors
- [ ] Python stubs exist: `tts_pb2.py` and `tts_pb2_grpc.py` in `src/services/chatterbox/`
