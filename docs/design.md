# Design Document: High-Performance Go-based LLM Inference Service (MVP)

**Status:** Draft  
**Target Architecture:** In-process integration via CGIO Bindings  
**Primary Goal:** Provide a low-latency, local LLM inference service embedded directly within a Go binary.

---

## 1. Executive Summary
This document outlines the technical architecture for an MVP service that integrates `llama.cpp` into a Go application using high-performance C-bindings. Unlike a client-server model, this approach embeds the inference engine into the Go process to eliminate network latency and simplify deployment into a single executable.

## 2. Technical Stack
*   **Languaage:** Go 1.21+
*   **Inference Engine:** `llama.cpp` (C++)
*   **Integration Layer:** `llama-go` (Choice based on high-performance, thread-safe concurrent inference support).
*   **Model Format:** GGUF (GPT-Generated Unified Format).
*   **Communication:** REST API (standard library `net/http`) for simplicity in MVP.

## 3. System Architecture

### 3.1 Component Diagram
```text
[ Client ] <--(HTTP/JSON)--> [ Go Service ]
                                 |
          _______________________|_______________________
         |                       |                       |
 [ API Handler ] <--> [ Model Manager ] <--> [ Inference Worker Pool ]
                                 |                       |
                         [ CGIO Bridge ] <------> [ llama.cpp (C++) ]
                                                         |
                                                 [ GPU/CPU Hardware ]
```

### 3.2 Component Definitions

#### A. API Handler (Entry Point)
*   **Responsibility:** Validate incoming JSON requests, manage HTTP timeouts, and map REST endpoints to internal service calls.
*   **Endpoints:**
    *   `POST /v1/completions`: Submit a prompt and receive a text response.
    *   `POST /v1/models`: Load/Switch a specific GGUF model.
    *   `GET /health`: Check system status (model loaded, memory availability).

#### B. Model Manager (Lifecycle & Resource Control)
*   **Responsibility:** Manage the lifecycle of the `llama.cpp` context.
*   **Key Functions:**
    *   `LoadModel(path string)`: Initializes the C++ context and allocates memory.
    *   `UnloadModel()`: Safely releases C++ memory to prevent leaks.
    *   **State Management:** Ensures only one model is resident in memory at a time to prevent OOM (Out of Memory) errors.

#### C. Inference Worker Pool (Concurrency Management)
*   **Problem:** `llama.cpp` inference is highly resource-intensive. Multiple concurrent Go routines attempting to access the same C++ context will cause crashes or massive performance degradation.
*   **Solution:** A **Worker Pool Pattern**.
    *   Incoming requests are pushed into a `Job Queue` (buffered channel).
    *   A fixed number of `Inference Workers` (strictly controlled based on available VRAM/RAM) pull jobs from the queue.
    *   Each worker performs a blocking call to the CGIO bridge.

#### D. CGIO Bridge (The Low-Level Layer)
*   **Responsibility:** Translates Go types (strings, slices) to C types (char pointers, integer arrays) and manages the memory boundary.
*   **Safety:** Implements strict `runtime.SetFinalizer` or explicit `Close()` patterns to ensure C-allocated memory is freed when Go objects are garbage collected.

## 4. Data Flow (Inference Request)
1.  **Client** sends `POST /v1/completions` with payload `{"prompt": "Hello"}`.
2.  **API Handler** decodes JSON and creates an `InferenceJob`.
3.  **Job** is sent to the `Inference Queue`.
4.  **Worker** pulls the `Job` and calls `bridge.Inference(prompt)`.
5.  **Bridge** enters the CGIO layer, calling the C++ `llama_decode` functions.
6.  **Result** flows back through the bridge $\rightarrow$ Worker $\rightarrow$ API Handler $\rightarrow$ **Client**.

## 5. Key Technical Challenges & Mitigations

| Challenge | Mitigation Strategy |
| :--- | :--- |
| **Memory Leaks** | Use explicit `Close()` methods for all model and context handles; implement a `defer` pattern in all CGIO wrappers. |
| **Concurrency Crashes** | Implement a strict Semaforhe or Worker Pool to ensure no more than *N* inference operations occur simultaneously. |
| **Build Complexity** | Use a `Makefile` or `Taskfile` to automate the compilation of `llama.cpp` and the subsequent `go build` with appropriate C-flags. |
| **OOM (Out of Memory)** | Implement a "Pre-flight Check" in the Model Manager to validate available system memory against the model's estimated weight size before loading. |

## 6. MVP Implementation Roadmap

### Phase 1: Environment & Tooling (Week 1)
*   [ ] Setup build environment (C++ toolchain, Go).
*   [ ] Automate `llama.cpp` compilation via Go build tags or Makefile.
*   [ ] Implement basic CGIO "Hello World" (single string in $\rightarrow$ single string out).

### Phase 2: Core Engine (Week 2)
*   [ ] Implement `ModelManager` with Load/Unload logic.
*   [ ] Implement `InferenceWorker` pool using Go channels.
*   [ ] Add basic error handling for failed C-calls.

### Phase 3: API & Integration (Week 3)
*   [ ] Implement standard `net/http` REST API.
*   [ ] Add JSON request/response parsing.
*   [ ] Integrate a sample GGUF model (e.g., Mistral-7B or Llamas-3-8B).

### Phase 4: Testing & Benchmarking (Week 4)
*   [ ] Run stress tests to observe Worker Pool behavior under load.
*   [ ] Monitor memory usage (Resident Set Size) during model swaps.
*   [ ] Benchmark tokens-per-second (TPS) for baseline performance.