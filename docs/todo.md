# MVP Implementation Todo List

## Phase 1: Environment & Tooling
- [ ] Research `llama-go` vs `go-llama.cpp` for current OS compatibility.
- [ ] Install `cmake` and C++ compiler dependencies.
- [ ] Clone `llama.cpp` source into an appropriate subdirectory.
- [ ] Create `Makefile` with `llama_build` target.
- [ ] Add `go build` target to `Makefile` with appropriate `CGO_LDFLAGS`.
- [ ] Create `test_bridge/main.go` for minimal C-string pass-through.
- [ ] Run `go test` on the bridge to verify successful linking.

## Phase 2: Core Engine Development
- [ ] Define `ModelManager` struct in `internal/engine/manager.go`.
- [ ] Implement `LoadModel` using `llama-go`'s context initialization.
- [ ] Implement `UnloadModel` with explicit memory cleanup.
- [ ] Create `InferenceJob` struct with `Prompt` and `ResponseChan` fields.
- [ ] Initialize a buffered `JobQueue` (channel) in `engine/worker_pool.go`.
- [ ] Implement `workerLoop` to listen on the `JobQueue`.
- [ ] Implement error wrapping for all CGIO-layer return codes.

## Phase 3: API & Integration
- [ ] Set up `cmd/server/main.go` with `http.NewServeMux`.
- [ ] Define `CompletionRequest` and `CompletionResponse` structs.
- [ ] Implement `POST /v1/completions` handler.
- [ ] Implement `POST /v1/models` handler.
- [ ] Implement `GET /health` handler.
- [ ] Download a small test GGUF model (e.g., Qwen-0.5B).
- [ ] Write an integration test using `net/http/httptest` to verify the full flow.

## Phase 4: Testing & Validation
- [ ] Create a load test script using `k6` or a custom Go script.
- [ ] Implement `pprof` endpoints for memory profiling.
- [ ] Run `go test -bench` to measure inference latency.
- [ ] Verify memory stability by loading/unloading the model 10 times in a loop.