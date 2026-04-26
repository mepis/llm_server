const { QdrantClient } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');

let qdrantClient = null;

const QDRANT_COLLECTION = 'rag_chunks';

const getQdrantClient = () => {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY || null;

    qdrantClient = new QdrantClient({
      url,
      apiKey,
    });
  }
  return qdrantClient;
};

const initQdrant = async () => {
  try {
    const client = getQdrantClient();

    // Check if collection exists
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === QDRANT_COLLECTION);

    if (!exists) {
      // Detect embedding dimension from env or default to 384 (MiniLM-L6-v2)
      const vectorSize = parseInt(process.env.EMBEDDING_DIM) || 384;

      await client.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
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

const upsertChunks = async (documentId, chunks) => {
  const client = getQdrantClient();

  const points = chunks.map((chunk, index) => ({
    id: `${documentId}_${index}`,
    vector: chunk.embedding,
    payload: {
      document_id: documentId.toString(),
      text: chunk.text,
      chunk_index: chunk.chunk_index,
      filename: chunk.filename,
      file_type: chunk.file_type,
      sheet_name: chunk.sheet_name || null,
    },
  }));

  await client.upsert(QDRANT_COLLECTION, {
    points,
  });

  return points.length;
};

const searchChunks = async (vector, limit = 10, minScore = 0.1, filters = {}) => {
  const client = getQdrantClient();

  const qdrantFilters = [];

  if (filters.document_ids && filters.document_ids.length > 0) {
    qdrantFilters.push({
      key: 'document_id',
      match: { any: filters.document_ids.map(d => d.toString()) },
    });
  }

  const queryPoint = {
    vector,
    limit,
    score_threshold: minScore,
  };

  if (qdrantFilters.length > 0) {
    queryPoint.with_payload = true;
    queryPoint.filter = { must: qdrantFilters };
  } else {
    queryPoint.with_payload = true;
  }

  const results = await client.query(QDRANT_COLLECTION, queryPoint);

  return results.map(r => ({
    text: r.payload.text,
    document_id: r.payload.document_id,
    filename: r.payload.filename,
    file_type: r.payload.file_type,
    chunk_index: r.payload.chunk_index,
    similarity: r.score,
    sheet_name: r.payload.sheet_name || null,
  }));
};

const deleteChunksByDocument = async (documentId) => {
  const client = getQdrantClient();

  // Fetch all point IDs for this document
  const results = await client.scroll(QDRANT_COLLECTION, {
    filter: {
      must: [
        { key: 'document_id', match: { value: documentId.toString() } },
      ],
    },
    limit: 10000,
    with_payload: false,
    with_vectors: false,
  });

  if (results.points.length === 0) return 0;

  const pointIds = results.points.map(p => p.id);

  await client.delete(QDRANT_COLLECTION, {
    points: pointIds,
  });

  return pointIds.length;
};

const countChunksByDocument = async (documentId) => {
  const client = getQdrantClient();

  const results = await client.scroll(QDRANT_COLLECTION, {
    filter: {
      must: [
        { key: 'document_id', match: { value: documentId.toString() } },
      ],
    },
    limit: 10000,
    with_payload: false,
    with_vectors: false,
  });

  return results.total;
};

module.exports = {
  initQdrant,
  upsertChunks,
  searchChunks,
  deleteChunksByDocument,
  countChunksByDocument,
};
