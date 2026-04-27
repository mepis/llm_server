const { QdrantClient, Distance } = require('@qdrant/js-client-grpc');
const logger = require('../utils/logger');

let qdrantClient = null;

const QDRANT_COLLECTION = 'rag_chunks';

// --- Protobuf Value extraction helpers ---

function extractStringValue(value) {
  if (!value || !value.kind) return null;
  if (value.kind.case === 'stringValue') return value.kind.value;
  if (value.kind.case === 'nullValue') return null;
  return null;
}

function extractIntegerValue(value) {
  if (!value || !value.kind) return null;
  if (value.kind.case === 'integerValue') {
    if (typeof value.kind.value === 'bigint') return value.kind.value;
    return BigInt(value.kind.value);
  }
  return null;
}

function extractSheetName(value) {
  if (!value || !value.kind) return null;
  if (value.kind.case === 'stringValue') return value.kind.value;
  if (value.kind.case === 'nullValue') return null;
  return null;
}

// --- Client initialization ---

const getQdrantClient = () => {
  if (!qdrantClient) {
    const host = process.env.QDRANT_GRPC_HOST || 'localhost';
    const port = parseInt(process.env.QDRANT_GRPC_PORT) || 6334;
    const apiKey = process.env.QDRANT_API_KEY || undefined;

    qdrantClient = new QdrantClient({ host, port, apiKey, checkCompatibility: false });
  }
  return qdrantClient;
};

const initQdrant = async () => {
  try {
    const client = getQdrantClient();

    const response = await client.api('collections').list({});
    const exists = response.collections.some(c => c.name === QDRANT_COLLECTION);

    if (!exists) {
      const vectorSize = parseInt(process.env.EMBEDDING_DIM) || 384;

      await client.api('collections').create({
        collectionName: QDRANT_COLLECTION,
        vectorsConfig: {
          config: {
            value: { size: BigInt(vectorSize), distance: Distance.Cosine },
            case: 'params',
          },
        },
      });

      logger.info(`Qdrant collection "${QDRANT_COLLECTION}" created with ${vectorSize}-dim cosine vectors`);
    } else {
      logger.info(`Qdrant collection "${QDRANT_COLLECTION}" already exists`);
    }

    return client;
  } catch (error) {
    logger.error('Qdrant initialization failed:', error.message);
    throw error;
  }
};

// --- Data operations ---

const upsertChunks = async (documentId, chunks) => {
  const client = getQdrantClient();

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
    vectors: {
      vectorsOptions: {
        value: { vector: { value: chunk.embedding, case: 'dense' } },
        case: 'vector',
      },
    },
  }));

  await client.api('points').upsert({
    collectionName: QDRANT_COLLECTION,
    points,
  });

  return points.length;
};

const searchChunks = async (vector, limit = 10, minScore = 0.1, filters = {}) => {
  const client = getQdrantClient();

  let filter = undefined;
  if (filters.document_ids && filters.document_ids.length > 0) {
    const conditions = filters.document_ids.map(docId => ({
      conditionOneOf: {
        value: {
          key: 'document_id',
          match: { matchValue: { value: docId.toString(), case: 'keyword' } },
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

  return response.result.map(r => ({
    text: extractStringValue(r.payload.text),
    document_id: extractStringValue(r.payload.document_id),
    filename: extractStringValue(r.payload.filename),
    file_type: extractStringValue(r.payload.file_type),
    chunk_index: Number(extractIntegerValue(r.payload.chunk_index)),
    similarity: r.score,
    sheet_name: extractSheetName(r.payload.sheet_name),
  }));
};

const deleteChunksByDocument = async (documentId) => {
  const client = getQdrantClient();

  const scrollResponse = await client.api('points').scroll({
    collectionName: QDRANT_COLLECTION,
    filter: {
      must: [{
        conditionOneOf: {
          value: {
            key: 'document_id',
            match: { matchValue: { value: documentId.toString(), case: 'keyword' } },
          },
          case: 'field',
        },
      }],
    },
    limit: 10000,
    withPayload: { selectorOptions: { value: false, case: 'enable' } },
    withVectors: { selectorOptions: { value: false, case: 'enable' } },
  });

  if (scrollResponse.result.length === 0) return 0;

  const pointIds = scrollResponse.result.map(p => p.id);

  await client.api('points').delete({
    collectionName: QDRANT_COLLECTION,
    points: {
      pointsSelectorOneOf: {
        value: { ids: pointIds },
        case: 'points',
      },
    },
  });

  return pointIds.length;
};

const countChunksByDocument = async (documentId) => {
  const client = getQdrantClient();

  const response = await client.api('points').count({
    collectionName: QDRANT_COLLECTION,
    filter: {
      must: [{
        conditionOneOf: {
          value: {
            key: 'document_id',
            match: { matchValue: { value: documentId.toString(), case: 'keyword' } },
          },
          case: 'field',
        },
      }],
    },
  });

  return Number(response.result.count);
};

// --- Scroll helper for paginated retrieval ---

const getChunksScroll = async (documentId, limit, offsetPointId) => {
  const client = getQdrantClient();

  const params = {
    collectionName: QDRANT_COLLECTION,
    filter: {
      must: [{
        conditionOneOf: {
          value: {
            key: 'document_id',
            match: { matchValue: { value: documentId.toString(), case: 'keyword' } },
          },
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

module.exports = {
  initQdrant,
  upsertChunks,
  searchChunks,
  deleteChunksByDocument,
  countChunksByDocument,
  getChunksScroll,
};
