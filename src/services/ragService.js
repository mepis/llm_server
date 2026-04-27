const { getDB } = require('../config/db');
const qdrant = require('../db/qdrant');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const documentParser = require('./documentParser');

const knex = () => getDB();

function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return msg || 'Unknown error';
  return msg
    .replace(/(\/[^:\s,;]+)+\.\w{1,6}/g, '[PATH]')
    .replace(/at\s+[^(\s]+:\d+:\d+/g, 'at [STACK]')
    .replace(/at\s+<anonymous>/g, 'at [STACK]')
    .replace(/Error:\s*.*\n/g, 'Error: ')
    .substring(0, 500);
}

const uploadDocument = async (userId, fileBuffer, filename, options = {}) => {
  try {
    const { description, tags = [] } = options;

    const fileExtension = path.extname(filename).toLowerCase().slice(1);
    const validExtensions = ['pdf', 'txt', 'doc', 'docx', 'md', 'json', 'csv', 'xlsx'];

    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type');
    }

    const fileDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    const filePath = path.join(fileDir, `${Date.now()}-${filename}`);

    fs.writeFileSync(filePath, fileBuffer);

    let fileContent;
    let metadataExtras = {};

    try {
      const parsed = await documentParser.parseFile(fileBuffer, fileExtension);
      fileContent = parsed.text;

      if (parsed.sheetNames) {
        metadataExtras.sheets = parsed.sheetNames;
      }
    } catch (parseError) {
      logger.error(`Document parsing failed for ${filename}:`, parseError.message || parseError);

      const errorMessage = parseError.type === 'encrypted'
        ? parseError.message
        : (parseError.message || 'Unknown parsing error');

      const id = require('uuid').v4();
      await knex().insert({
        id,
        user_id: userId,
        filename,
        file_type: fileExtension,
        file_size: fileBuffer.length,
        file_path: filePath,
        content: '',
        metadata: JSON.stringify({ description, tags, parse_error: sanitizeErrorMessage(errorMessage) }),
        status: 'failed',
      }).into('rag_documents');

      const document = await knex().from('rag_documents').where({ id }).first();

      logger.info(`Document failed to parse: ${document.id} by user ${userId}`);

      return { success: true, data: document };
    }

    const metadata = { description, tags, ...metadataExtras };

    const id = require('uuid').v4();
    await knex().insert({
      id,
      user_id: userId,
      filename,
      file_type: fileExtension,
      file_size: fileBuffer.length,
      file_path: filePath,
      content: fileContent,
      metadata: JSON.stringify(metadata),
      status: 'processing',
    }).into('rag_documents');

    const document = await knex().from('rag_documents').where({ id }).first();

    logger.info(`Document uploaded: ${document.id} by user ${userId}`);

    processDocument(document.id).catch(err => {
      logger.error(`Background processing failed for document ${document.id}: ${err.message}`);
    });

    return { success: true, data: document };
  } catch (error) {
    logger.error('Document upload failed:', error.message);
    throw error;
  }
};

const processDocument = async (documentId) => {
  try {
    const document = await knex().from('rag_documents').where({ id: documentId }).first();

    if (!document) throw new Error('Document not found');

    if (document.status === 'indexed') {
      return { success: true, data: document };
    }

    await knex().from('rag_documents').where({ id: documentId }).update({ status: 'processing' });

    const chunks = chunkText(document.content, 500);

    // Process in batches to avoid overwhelming the embedding service
    const batchPromises = chunks.map(async (chunk, i) => {
      try {
        const embeddingResponse = await llamaService.getEmbeddings(chunk);
        const embedding = embeddingResponse.data[0]?.embedding;

        if (embedding) {
          // Get document info for payload
          const doc = await knex().from('rag_documents').where({ id: documentId }).first();
          const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});
          const sheets = metadata.sheets || [];

          await qdrant.upsertChunks(documentId, [{
            embedding,
            text: chunk,
            chunk_index: i,
            filename: doc.filename,
            file_type: doc.file_type,
            sheet_name: sheets[i] || null,
          }]);
        }
      } catch (chunkError) {
        logger.error(`Failed to process chunk ${i} of document ${documentId}:`, chunkError.message);
      }
    });

    // Process in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < batchPromises.length; i += batchSize) {
      await Promise.all(batchPromises.slice(i, i + batchSize));
    }

    await knex().from('rag_documents')
      .where({ id: documentId })
      .update({ status: 'indexed', processed_at: new Date() });

    const updatedDoc = await knex().from('rag_documents').where({ id: documentId }).first();

    logger.info(`Document processed: ${documentId}`);

    return { success: true, data: updatedDoc };
  } catch (error) {
    logger.error('Document processing failed:', error.message);

    await knex().from('rag_documents')
      .where({ id: documentId })
      .update({ status: 'failed', error_message: sanitizeErrorMessage(error.message) });

    throw error;
  }
};

const chunkText = (text, chunkSize = 500) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk.length + word.length + 1) > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += ' ' + word;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const searchDocuments = async (userId, query, limit = 10, documentIds = []) => {
  try {
    const queryEmbedding = await llamaService.getEmbeddings(query);
    const queryVector = queryEmbedding.data[0]?.embedding;

    if (!queryVector) {
      throw new Error('Failed to generate query embedding');
    }

    let accessibleDocIds = [];

    if (documentIds && documentIds.length > 0) {
      accessibleDocIds = documentIds;
    } else {
      // Personal documents
      const personalDocs = await knex().from('rag_documents')
        .where({ user_id: userId, status: 'indexed' })
        .select('id');
      accessibleDocIds = personalDocs.map(d => d.id);

      // Group-shared documents
      const documentGroupService = require('./documentGroupService');
      const accessibleDocsResult = await documentGroupService.getGroupAccessibleDocuments(userId);
      if (accessibleDocsResult.success) {
        const groupDocs = accessibleDocsResult.data.filter(d => d.source === 'group');
        const groupDocIds = groupDocs.map(d => d.id);
        accessibleDocIds = [...new Set([...accessibleDocIds, ...groupDocIds])];
      }
    }

    // Search in Qdrant with payload filter
    const results = await qdrant.searchChunks(queryVector, limit, 0.1, { document_ids: accessibleDocIds });

    // Build sources map from results
    const sourcesMap = new Map();
    for (const result of results) {
      if (!sourcesMap.has(result.document_id)) {
        const doc = await knex().from('rag_documents')
          .where({ id: result.document_id })
          .select('id as document_id', 'filename', 'file_type')
          .first();
        if (doc) {
          sourcesMap.set(result.document_id, {
            ...doc,
            total_chunks_used: 0,
          });
        }
      }
    }

    // Enrich results with document metadata and track source usage
    const enrichedResults = results.map(r => {
      const source = sourcesMap.get(r.document_id);
      if (source) source.total_chunks_used += 1;
      return r;
    });

    return {
      success: true,
      data: {
        results: enrichedResults,
        sources: Array.from(sourcesMap.values()),
      },
    };
  } catch (error) {
    logger.error('Document search failed:', error.message);
    throw error;
  }
};

const deleteDocument = async (documentId) => {
  try {
    const document = await knex().from('rag_documents').where({ id: documentId }).first();
    if (!document) throw new Error('Document not found');
    await knex().from('rag_documents').where({ id: documentId }).del();

    // Delete chunks from Qdrant
    await qdrant.deleteChunksByDocument(documentId);

    // Delete physical file
    if (document.file_path && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    logger.info(`Document deleted: ${documentId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete document failed:', error.message);
    throw error;
  }
};

const getDocumentsByUser = async (userId) => {
  try {
    const documents = await knex().from('rag_documents')
      .where({ user_id: userId })
      .orderBy('uploaded_at', 'desc');

    return { success: true, data: documents };
  } catch (error) {
    logger.error('Get user documents failed:', error.message);
    throw error;
  }
};

const getDocumentById = async (documentId) => {
  try {
    const document = await knex().from('rag_documents').where({ id: documentId }).first();

    if (!document) throw new Error('Document not found');

    return { success: true, data: document };
  } catch (error) {
    logger.error('Get document failed:', error.message);
    throw error;
  }
};

const getChunks = async (documentId, userId, options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;
    const document = await knex().from('rag_documents').where({ id: documentId }).first();

    if (!document) throw new Error('Document not found');

    const total = await qdrant.countChunksByDocument(documentId);
    const skip = (page - 1) * limit;

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

const updateSettings = async (documentId, userId, settings) => {
  try {
    const document = await knex().from('rag_documents').where({ id: documentId }).first();

    if (!document) throw new Error('Document not found');

    let metadata = typeof document.metadata === 'string' ? JSON.parse(document.metadata) : (document.metadata || {});
    metadata = { ...metadata, ...settings };

    await knex().from('rag_documents').where({ id: documentId }).update({ metadata: JSON.stringify(metadata) });

    const updatedDoc = await knex().from('rag_documents').where({ id: documentId }).first();

    return { success: true, data: updatedDoc };
  } catch (error) {
    logger.error('Update settings failed:', error.message);
    throw error;
  }
};

module.exports = {
  uploadDocument,
  processDocument,
  chunkText,
  searchDocuments,
  deleteDocument,
  getDocumentsByUser,
  getDocumentById,
  getChunks,
  updateSettings,
};
