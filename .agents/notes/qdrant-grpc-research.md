# Qdrant gRPC Migration - Research Notes

## gRPC Client API Surface

### Package: `@qdrant/js-client-grpc@1.17.0`
- Default gRPC port: **6334** (HTTP port is 6333)
- Uses connect-es under the hood (protobuf-based)
- All numeric sizes/limits are `bigint`
- All IDs, payloads, filters use discriminated unions (oneof)

### Client Construction
```js
const { QdrantClient, Distance } = require('@qdrant/js-client-grpc');
const client = new QdrantClient({
  host: 'localhost',
  port: 6334,
  apiKey: undefined,
  checkCompatibility: false,
});
```

### API Access Pattern
```js
// Collections API
const collections = await client.api('collections').list({});
// Response: { collections: [{ name: 'rag_chunks' }], time: 0.001 }

const response = await client.api('collections').create({
  collectionName: 'rag_chunks',
  vectorsConfig: {
    config: {
      value: { size: BigInt(384), distance: Distance.Cosine },
      case: 'params',
    },
  },
});
```

### Point Operations

#### Upsert
```js
await client.api('points').upsert({
  collectionName: 'rag_chunks',
  points: [{
    id: { pointIdOptions: { value: 'doc_uuid_0', case: 'uuid' } },
    payload: {
      document_id: { kind: { value: 'doc-uuid', case: 'stringValue' } },
      text: { kind: { value: 'chunk text', case: 'stringValue' } },
      chunk_index: { kind: { value: BigInt(0), case: 'integerValue' } },
      filename: { kind: { value: 'file.pdf', case: 'stringValue' } },
      file_type: { kind: { value: 'pdf', case: 'stringValue' } },
      sheet_name: { kind: { value: 0, case: 'nullValue' } },
    },
    vectors: {
      vectorsOptions: {
        value: { vector: { value: [0.1, 0.2, ...], case: 'dense' } },
        case: 'vector',
      },
    },
  }],
});
```

#### Search
```js
const response = await client.api('points').search({
  collectionName: 'rag_chunks',
  vector: [0.1, 0.2, ...],
  limit: BigInt(10),
  scoreThreshold: 0.1,
  withPayload: { selectorOptions: { value: true, case: 'enable' } },
  filter: {
    must: [{
      conditionOneOf: {
        value: {
          key: 'document_id',
          match: { matchValue: { value: 'doc-uuid', case: 'keyword' } },
        },
        case: 'field',
      },
    }],
  },
});
// Response: { result: [{ id, payload: {}, score: 0.95, version, ... }], time }
```

#### Scroll
```js
const response = await client.api('points').scroll({
  collectionName: 'rag_chunks',
  filter: { must: [...] },
  limit: 20,
  offset: { pointIdOptions: { value: 'last-point-id', case: 'uuid' } },
  withPayload: { selectorOptions: { value: true, case: 'enable' } },
  withVectors: { selectorOptions: { value: false, case: 'enable' } },
});
// Response: { nextPageOffset: PointId | undefined, result: RetrievedPoint[], time }
```

#### Delete
```js
await client.api('points').delete({
  collectionName: 'rag_chunks',
  points: {
    pointsSelectorOneOf: {
      value: { ids: [{ pointIdOptions: { value: 'id', case: 'uuid' } }] },
      case: 'points',
    },
  },
});
```

#### Count
```js
const response = await client.api('points').count({
  collectionName: 'rag_chunks',
  filter: { must: [...] },
});
// Response: { result: { count: BigInt }, time }
```

## Key Type Mappings

| REST | gRPC |
|---|---|
| `client.getCollections()` | `client.api('collections').list({})` |
| `client.createCollection(name, opts)` | `client.api('collections').create({ collectionName, ... })` |
| `client.upsert(collection, { points })` | `client.api('points').upsert({ collectionName, points })` |
| `client.query(collection, { vector, ... })` | `client.api('points').search({ collectionName, vector, ... })` |
| `client.scroll(collection, { ... })` | `client.api('points').scroll({ collectionName, ... })` |
| `client.delete(collection, { points })` | `client.api('points').delete({ collectionName, points })` |

## Protobuf Oneof Pattern

All protobuf oneofs follow this pattern:
```js
{
  fieldNameOptions: {
    value: <actual value>,
    case: '<variant name>',
  },
}
```

Common variants:
- `PointId`: `case: 'uuid'` (string) or `case: 'num'` (bigint)
- `Value.kind`: `case: 'stringValue'`, `case: 'integerValue'`, `case: 'nullValue'`, etc.
- `Match.matchValue`: `case: 'keyword'`, `case: 'integer'`, `case: 'keywords'`, etc.
- `Vectors.vectorsOptions`: `case: 'vector'` (single) or `case: 'vectors'` (named)
- `Vector.vector`: `case: 'dense'`, `case: 'sparse'`, `case: 'multiDense'`
- `WithPayloadSelector.selectorOptions`: `case: 'enable'` (boolean) or `case: 'include'`
- `Condition.conditionOneOf`: `case: 'field'`, `case: 'isEmpty'`, etc.
- `PointsSelector.pointsSelectorOneOf`: `case: 'points'` or `case: 'filter'`

## Distance Enum
```js
Distance.UnknownDistance = 0
Distance.Cosine = 1
Distance.Euclid = 2
Distance.Dot = 3
Distance.Manhattan = 4
```

## Existing Code Issues

1. `initQdrant()` exported but never called -- collection not auto-created
2. `ragService.getChunks()` creates its own QdrantClient (lines 325-329)
3. No docker-compose file for Qdrant -- must be started externally

## Qdrant Binary Download

Latest release: `https://github.com/qdrant/qdrant/releases`
Binary format: `qdrant-x86_64-unknown-linux-gnu` (Linux amd64)
Recommended version: v1.12.0 (matches client major version 1.x)

Run command: `./qdrant server --grpc-port 6334 --http-port 6333`
Or default: `./qdrant server` (gRPC on 6334, HTTP on 6333)
