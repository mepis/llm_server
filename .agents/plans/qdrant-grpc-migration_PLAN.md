# Qdrant gRPC Migration Plan

## Purpose

Migrate the Qdrant vector database client from HTTP (`@qdrant/js-client-rest`) to gRPC (`@qdrant/js-client-grpc`) and add local Qdrant binary installation support.

**Target Audience**: Coding agents running on a local instance of llama.cpp with limited context window.

**Expected Outcomes**:
- gRPC client replaces REST client for lower latency and better performance
- Qdrant binary can be installed and run locally without Docker
- All existing RAG operations (upsert, search, scroll, delete, count) work identically
- `initQdrant()` is properly called at server startup (currently not called -- bug fix)
- Duplicate client in `ragService.getChunks()` is eliminated (bug fix)

**Tags**: `qdrant`, `grpc`, `rag`, `vector-store`, `infrastructure`, `migration`

---

## Progress

- [x] Research gRPC client API surface from package type definitions -- 2026-04-26 -- Done
- [x] Map all REST calls to gRPC equivalents -- 2026-04-26 -- Done
- [x] Identify bugs in existing code (uncalled `initQdrant`, duplicate client) -- 2026-04-26 -- Done
- [ ] Phase 1: Environment and dependencies
- [x] Phase 2: Rewrite `src/db/qdrant.js`
- [x] Phase 3: Fix `src/services/ragService.js`
- [x] Phase 4: Wire up server initialization
- [x] Phase 5: Documentation updates
- [x] Phase 6: Validation

---

## Surprises & Discoveries

1. **`initQdrant()` is never called**. The function is exported from `src/db/qdrant.js` but never invoked in `src/server.js` or anywhere else. The `rag_chunks` collection is never auto-created at startup. This is a pre-existing bug.

2. **Duplicate client in `getChunks()`**. `src/services/ragService.js` lines 325-329 create a second `QdrantClient` instance instead of using the shared singleton. This breaks the singleton pattern and opens a second connection.

3. **gRPC uses protobuf oneof types extensively**. Simple values like `PointId`, `Value`, `Match`, `Vectors`, and `WithPayloadSelector` are discriminated unions (oneof). This means plain objects like `{ id: "uuid_0" }` must become `{ pointIdOptions: { value: "uuid_0", case: "uuid" } }`.

4. **`BigInt` is used throughout**. Fields like `limit`, `offset`, `size`, and `count` are `bigint` in the gRPC types, not plain `number`. This requires explicit `BigInt()` conversions.

5. **Scroll pagination is offset-based**. The REST client uses numeric offset (array index), but the gRPC `scroll` uses `PointId` offset (last returned point's ID). The `getChunks()` function will need to track the last point ID for pagination, not a numeric offset.

6. **`Distance` is an enum**. `Distance.Cosine = 1` in the gRPC types, not the string `'Cosine'`.

7. **gRPC default port is 6334**. The gRPC port differs from the HTTP port (6333). The user requested binary installation, so Qdrant will serve gRPC on 6334.

8. **`CountPoints` returns `result.count` as `bigint`**. Need to convert with `Number()` for use in JavaScript.

---

## Decision Log

| Date | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| 2026-04-26 | Use `search` API instead of `query` API | The `query` API is the newer unified endpoint | `search` matches existing behavior exactly. `query` requires wrapping the vector in a `VectorInput` oneof. Minimal change reduces risk. |
| 2026-04-26 | Keep `QDRANT_API_KEY` env var | Could remove since gRPC uses `apiKey` param | The gRPC client accepts `apiKey` in the constructor. Keep env var for compatibility. |
| 2026-04-26 | Split `QDRANT_URL` into `QDRANT_GRPC_HOST` + `QDRANT_GRPC_PORT` | Could keep `QDRANT_URL` and parse it | The gRPC client expects `host` without protocol/port. Splitting is cleaner and avoids parsing logic. |
| 2026-04-26 | Use `scroll` with `PointId` offset for pagination | Could fetch all points and paginate in memory | `scroll` is the proper gRPC pagination mechanism. Memory pagination would break for large documents. |
| 2026-04-26 | Install Qdrant via binary download script | Could use Docker | User requested binary. Docker was not requested. |
| 2026-04-26 | Fix `initQdrant()` not being called at startup | Could leave as-is and create collection lazily | Collection must exist before upsert. Better to fail fast at startup. |
| 2026-04-26 | Fix duplicate client in `getChunks()` | Could leave as-is | Two connections waste resources. Singleton pattern should be enforced. |

---

## Plan of Work

### Phase 1: Environment and Dependencies (4 tasks)

**Purpose**: Update environment configuration and install the gRPC package.

**Dependencies**: None

#### Task 1.1: Create Qdrant binary installation script

**File**: `scripts/install-qdrant.sh` (new file)

**Steps**:
1. Create `scripts/` directory if it doesn't exist (check with `ls scripts/`)
2. Write a bash script that:
   - Detects OS architecture (`uname -m` and `uname -s`)
   - Downloads the appropriate Qdrant binary from `https://github.com/qdrant/qdrant/releases/download/v1.12.0/qdrant-x86_64-unknown-linux-gnu` (use v1.12.0 to match client major version)
   - Saves to `bin/qdrant` in the project root
   - Makes executable (`chmod +x`)
   - Prints usage instructions: `./bin/qdrant server --grpc-port 6334 --http-port 6333`
3. The script should check for existing binary and skip if present

#### Task 1.2: Update `.env.example`

**File**: `.env.example` (edit lines 16-19)

**Steps**:
1. Replace `QDRANT_URL=http://localhost:6333` with two new variables:
   - `QDRANT_GRPC_HOST=localhost`
   - `QDRANT_GRPC_PORT=6334`
2. Keep `QDRANT_API_KEY=` and `EMBEDDING_DIM=384` unchanged
3. Update the comment to mention gRPC port 6334

#### Task 1.3: Update `src/utils/environment.js`

**File**: `src/utils/environment.js` (edit line 13)

**Steps**:
1. Replace `QDRANT_URL` entry with two entries:
   - `{ name: 'QDRANT_GRPC_HOST', default: 'localhost', description: 'Qdrant gRPC host' }`
   - `{ name: 'QDRANT_GRPC_PORT', default: '6334', description: 'Qdrant gRPC port' }`

#### Task 1.4: Replace npm package

**File**: `package.json` (edit dependency)

**Steps**:
1. Run `npm uninstall @qdrant/js-client-rest`
2. Run `npm install @qdrant/js-client-grpc@^1.17.0`
3. Verify `package.json` now lists `@qdrant/js-client-grpc` instead of `@qdrant/js-client-rest`

**Acceptance**: `npm ls @qdrant/js-client-grpc` shows installed version; `npm ls @qdrant/js-client-rest` shows NOT installed.

---

### Phase 2: Rewrite `src/db/qdrant.js` (3 tasks)

**Purpose**: Migrate all Qdrant operations to use the gRPC client with protobuf types.

**Dependencies**: Phase 1 complete

#### Task 2.1: Rewrite client initialization and collection management

**File**: `src/db/qdrant.js`

**Steps**:
1. Change import from `const { QdrantClient } = require('@qdrant/js-client-rest')` to `const { QdrantClient, Distance } = require('@qdrant/js-client-grpc')`
2. Rewrite `getQdrantClient()` to use gRPC constructor:
   ```js
   const host = process.env.QDRANT_GRPC_HOST || 'localhost';
   const port = parseInt(process.env.QDRANT_GRPC_PORT) || 6334;
   const apiKey = process.env.QDRANT_API_KEY || undefined;
   qdrantClient = new QdrantClient({ host, port, apiKey, checkCompatibility: false });
   ```
3. Rewrite `initQdrant()`:
   - List collections via `client.api('collections').list({})`
   - Check if collection exists: `response.collections.some(c => c.name === QDRANT_COLLECTION)`
   - Create collection via `client.api('collections').create({ collectionName: QDRANT_COLLECTION, vectorsConfig: { config: { value: { size: BigInt(vectorSize), distance: Distance.Cosine }, case: 'params' } } })`

#### Task 2.2: Rewrite data operations (upsert, search, delete)

**File**: `src/db/qdrant.js`

**Steps**:
1. Rewrite `upsertChunks()`:
   ```js
   const points = chunks.map((chunk, index) => ({
     id: { pointIdOptions: { value: `${documentId}_${index}`, case: 'uuid' } },
     payload: {
       document_id: { kind: { value: documentId.toString(), case: 'stringValue' } },
       text: { kind: { value: chunk.text, case: 'stringValue' } },
       chunk_index: { kind: { value: BigInt(chunk.chunk_index), case: 'integerValue' } },
       filename: { kind: { value: chunk.filename, case: 'stringValue' } },
       file_type: { kind: { value: chunk.file_type, case: 'stringValue' } },
       sheet_name: chunk.sheet_name
         ? { kind: { value: chunk.sheet_name, case: 'stringValue' } }
         : { kind: { value: 0, case: 'nullValue' } },
     },
     vectors: { vectorsOptions: { value: { vector: { value: chunk.embedding, case: 'dense' } }, case: 'vector' } },
   }));
   await client.api('points').upsert({ collectionName: QDRANT_COLLECTION, points });
   ```

2. Rewrite `searchChunks()`:
   ```js
   // Build filter if document_ids provided
   let filter = undefined;
   if (filters.document_ids && filters.document_ids.length > 0) {
     const conditions = filters.document_ids.map(docId => ({
       conditionOneOf: {
         value: {
           key: 'document_id',
           match: {
             matchValue: { value: docId.toString(), case: 'keyword' },
           },
         },
         case: 'field',
       },
     }));
     filter = { must: conditions };
   }

   const response = await client.api('points').search({
     collectionName: QDRANT_COLLECTION,
     vector,
     limit: BigInt(limit),
     scoreThreshold: minScore,
     withPayload: { selectorOptions: { value: true, case: 'enable' } },
     ...(filter ? { filter } : {}),
   });

   // Parse response: response.result is ScoredPoint[]
   return response.result.map(r => ({
     text: extractStringValue(r.payload.text),
     document_id: extractStringValue(r.payload.document_id),
     filename: extractStringValue(r.payload.filename),
     file_type: extractStringValue(r.payload.file_type),
     chunk_index: Number(extractIntegerValue(r.payload.chunk_index)),
     similarity: r.score,
     sheet_name: extractSheetName(r.payload.sheet_name),
   }));
   ```

3. Add helper functions for extracting values from protobuf `Value` oneofs:
   - `extractStringValue(value)` -> returns string or null
   - `extractIntegerValue(value)` -> returns bigint or null
   - `extractSheetName(value)` -> returns string or null

4. Rewrite `deleteChunksByDocument()`:
   - First scroll to find point IDs (see Task 2.3 for scroll logic)
   - Then delete:
   ```js
   const pointIds = scrollResult.result.map(p => p.id);
   await client.api('points').delete({
     collectionName: QDRANT_COLLECTION,
     points: { pointsSelectorOneOf: { value: { ids: pointIds }, case: 'points' } },
   });
   ```

#### Task 2.3: Rewrite count and add scroll helper

**File**: `src/db/qdrant.js`

**Steps**:
1. Rewrite `countChunksByDocument()`:
   ```js
   const response = await client.api('points').count({
     collectionName: QDRANT_COLLECTION,
     filter: {
       must: [{
         conditionOneOf: {
           value: { key: 'document_id', match: { matchValue: { value: documentId.toString(), case: 'keyword' } } },
           case: 'field',
         },
       }],
     },
   });
   return Number(response.result.count);
   ```

2. Add new `getChunksScroll()` function for paginated chunk retrieval:
   ```js
   const getChunksScroll = async (documentId, limit, offsetPointId) => {
     const client = getQdrantClient();
     const params = {
       collectionName: QDRANT_COLLECTION,
       filter: {
         must: [{
           conditionOneOf: {
             value: { key: 'document_id', match: { matchValue: { value: documentId.toString(), case: 'keyword' } } },
             case: 'field',
           },
         }],
       },
       limit,
       withPayload: { selectorOptions: { value: true, case: 'enable' } },
       withVectors: { selectorOptions: { value: false, case: 'enable' } },
     };
     if (offsetPointId) {
       params.offset = { pointIdOptions: { value: offsetPointId, case: 'uuid' } };
     }
     const response = await client.api('points').scroll(params);
     return {
       points: response.result.map(p => ({
         text: extractStringValue(p.payload.text),
         chunk_index: Number(extractIntegerValue(p.payload.chunk_index)),
         document_id: extractStringValue(p.payload.document_id),
         pointId: p.id?.pointIdOptions?.value || null,
       })),
       nextPageOffset: response.nextPageOffset?.pointIdOptions?.value || null,
     };
   };
   ```

3. Update `module.exports` to include `getChunksScroll`

**Acceptance**: All functions compile without errors. Helper functions correctly extract values from protobuf oneof types.

---

### Phase 3: Fix `src/services/ragService.js` (1 task)

**Purpose**: Remove duplicate client and use shared qdrant module for `getChunks()`.

**Dependencies**: Phase 2 complete

#### Task 3.1: Fix `getChunks()` function

**File**: `src/services/ragService.js` (edit lines 313-355)

**Steps**:
1. Remove lines 325-326: `const { QdrantClient } = require('@qdrant/js-client-rest')` and the client instantiation
2. Rewrite `getChunks()` to use `qdrant.getChunksScroll()`:
   ```js
   const getChunks = async (documentId, userId, options = {}) => {
     try {
       const { page = 1, limit = 20 } = options;
       const document = await knex().from('rag_documents').where({ id: documentId }).first();
       if (!document) throw new Error('Document not found');

       const total = await qdrant.countChunksByDocument(documentId);

       // For page 1, scroll without offset
       // For subsequent pages, need to track offset from previous page
       // Since we can't pass PointId offset via query params easily,
       // use a simple approach: scroll all and paginate in memory for small sets,
       // or use offset-based scroll for page > 1
       const skip = (page - 1) * limit;

       // Scroll in batches to reach the skip position
       let lastOffset = null;
       let allPoints = [];
       let consumed = 0;

       while (consumed + allPoints.length < skip + limit) {
         const scrollResult = await qdrant.getChunksScroll(documentId, Math.max(limit, 100), lastOffset);
         allPoints.push(...scrollResult.points);
         consumed += scrollResult.points.length;
         if (!scrollResult.nextPageOffset) break;
         lastOffset = scrollResult.nextPageOffset;
       }

       // Slice to get the requested page
       const pagePoints = allPoints.slice(skip, skip + limit);

       const chunks = pagePoints.map(p => ({
         text: p.text,
         chunk_index: p.chunk_index,
         document_id: p.document_id,
       }));

       return {
         success: true,
         data: { chunks, total, page: parseInt(page), limit: parseInt(limit) },
       };
     } catch (error) {
       logger.error('Get chunks failed:', error.message);
       throw error;
     }
   };
   ```

**Acceptance**: No import of `@qdrant/js-client-rest` remains in the file. All Qdrant operations go through the shared `qdrant` module.

---

### Phase 4: Wire up server initialization (1 task)

**Purpose**: Call `initQdrant()` at server startup and add graceful shutdown.

**Dependencies**: Phase 2 complete

#### Task 4.1: Update `src/server.js`

**File**: `src/server.js`

**Steps**:
1. Add import at the top: `const { initQdrant } = require('./db/qdrant');`
2. In `startServer()`, after `await setupDatabase()` and before `await roleService.ensureBuiltinRoles()`, add:
   ```js
   try {
     await initQdrant();
   } catch (error) {
     logger.warn('Qdrant initialization failed (RAG features will be unavailable):', error.message);
     // Do NOT exit -- Qdrant is optional for non-RAG features
   }
   ```
3. The SIGTERM/SIGINT handlers already call `shutdownTTS()`. No additional gRPC cleanup is needed since the gRPC client doesn't have an explicit `close()` method (it relies on Node.js connection teardown).

**Acceptance**: Server logs "Qdrant collection 'rag_chunks' already exists" or "created" on startup. Server starts even if Qdrant is unavailable (warning logged).

---

### Phase 5: Documentation Updates (3 tasks)

**Purpose**: Keep documentation in sync with the migration.

**Dependencies**: All code changes complete

#### Task 5.1: Update `.env.example` comment and `AGENTS.md`

**Files**: `AGENTS.md`

**Steps**:
1. In `AGENTS.md`, update the Qdrant reference to mention gRPC port 6334 instead of HTTP 6333
2. Update the `AGENTS.md` Gotchas section if needed

#### Task 5.2: Update `docs/CHANGELOG.md`

**File**: `docs/CHANGELOG.md`

**Steps**:
1. Add entry at the top of the changelog:
   ```
   ## [Date] - Qdrant gRPC Migration
   - Migrated Qdrant client from HTTP (@qdrant/js-client-rest) to gRPC (@qdrant/js-client-grpc)
   - Added Qdrant binary installation script (scripts/install-qdrant.sh)
   - Fixed initQdrant() not being called at server startup
   - Fixed duplicate QdrantClient in ragService.getChunks()
   - Updated environment variables: QDRANT_URL replaced with QDRANT_GRPC_HOST and QDRANT_GRPC_PORT
   ```

#### Task 5.3: Update technical documentation

**Files**: `docs/technical/configuration-guide.md` (update Qdrant section)

**Steps**:
1. Update any references to Qdrant HTTP port 6333 to gRPC port 6334
2. Document the new environment variables

**Acceptance**: All documentation references are consistent with the gRPC setup.

---

### Phase 6: Validation (2 tasks)

**Purpose**: Verify the migration works correctly.

**Dependencies**: All code changes complete

#### Task 6.1: Run existing tests

**Steps**:
1. Ensure Qdrant is running (start binary: `./bin/qdrant server`)
2. Ensure MariaDB is running
3. Run `npm run test`
4. Verify all RAG-related tests pass
5. If tests fail, check error messages for protobuf type mismatches

#### Task 6.2: Manual smoke test

**Steps**:
1. Start the server: `npm run dev`
2. Verify startup log shows Qdrant collection initialization
3. Upload a test document via the API
4. Search for the document
5. Retrieve chunks for the document
6. Delete the document
7. Verify all operations succeed without errors

**Acceptance**: All RAG operations complete successfully. Server starts without errors. No references to `@qdrant/js-client-rest` remain in the codebase (grep to verify).

---

## Validation & Acceptance Criteria

### L1 Done (Unit/Component Level)
- Each function in `src/db/qdrant.js` compiles and runs without type errors
- Helper functions correctly extract values from protobuf oneof types
- `getQdrantClient()` returns a valid gRPC client instance

### L2 Done (Integration Level)
- `initQdrant()` creates the `rag_chunks` collection with Cosine distance
- `upsertChunks()` stores points retrievable by `searchChunks()`
- `searchChunks()` returns results with correct payload fields
- `deleteChunksByDocument()` removes all points for a document
- `countChunksByDocument()` returns accurate count
- `getChunks()` returns paginated results correctly

### L3 Done (System Level)
- `npm run test` passes all tests
- Server starts and initializes Qdrant collection
- Full RAG workflow (upload -> process -> search -> delete) completes end-to-end
- No `@qdrant/js-client-rest` references remain in the codebase

### Stop Conditions
- If `npm run test` fails after 3 rounds of fixes, stop and document the failures
- If the gRPC client cannot connect to the Qdrant binary, verify the binary is running on port 6334

---

## File Change Summary

| File | Action | Description |
|---|---|---|
| `scripts/install-qdrant.sh` | **Create** | Binary download and installation script |
| `.env.example` | **Edit** | Replace `QDRANT_URL` with `QDRANT_GRPC_HOST` + `QDRANT_GRPC_PORT` |
| `src/utils/environment.js` | **Edit** | Update optional env vars list |
| `package.json` | **Edit** | Replace REST package with gRPC package |
| `src/db/qdrant.js` | **Rewrite** | Full gRPC migration with protobuf types |
| `src/services/ragService.js` | **Edit** | Remove duplicate client, use shared module |
| `src/server.js` | **Edit** | Add `initQdrant()` call at startup |
| `docs/CHANGELOG.md` | **Edit** | Add migration entry |
| `AGENTS.md` | **Edit** | Update Qdrant references |
| `docs/technical/configuration-guide.md` | **Edit** | Update port and env var docs |
