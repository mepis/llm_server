const RAGDocument = require('../models/RAGDocument');
const DocumentGroup = require('../models/DocumentGroup');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const documentParser = require('./documentParser');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
      
      const document = await RAGDocument.create({
        user_id: userId,
        filename,
        file_type: fileExtension,
        file_size: fileBuffer.length,
        file_path: filePath,
        content: '',
        metadata: {
          description,
          tags,
          parse_error: errorMessage
        },
        status: 'failed'
      });
      
      logger.info(`Document failed to parse: ${document._id} by user ${userId}`);
      
      return {
        success: true,
        data: document
      };
    }
    
    const metadata = {
      description,
      tags,
      ...metadataExtras
    };
    
    const document = await RAGDocument.create({
      user_id: userId,
      filename,
      file_type: fileExtension,
      file_size: fileBuffer.length,
      file_path: filePath,
      content: fileContent,
      metadata,
      status: 'processing'
    });
    
    logger.info(`Document uploaded: ${document._id} by user ${userId}`);

    // Start processing in the background
    processDocument(document._id).catch(err => {
      logger.error(`Background processing failed for document ${document._id}: ${err.message}`);
    });
    
    return {
      success: true,
      data: document
    };
  } catch (error) {
    logger.error('Document upload failed:', error.message);
    throw error;
  }
};

const processDocument = async (documentId) => {
  try {
    const document = await RAGDocument.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    if (document.status === 'indexed') {
      return {
        success: true,
        data: document
      };
    }
    
    document.status = 'processing';
    await document.save();
    
    const chunks = chunkText(document.content, 500);
    
    const newChunks = [];
    
    for (const chunk of chunks) {
      const embeddingResponse = await llamaService.getEmbeddings(chunk);
      const embedding = embeddingResponse.data[0]?.embedding;
      
      if (embedding) {
        newChunks.push({
          text: chunk,
          embedding,
          chunk_index: newChunks.length
        });
      }
    }
    
    document.chunked_content.push(...newChunks);
    document.status = 'indexed';
    document.processed_at = new Date();
    await document.save();
    
    logger.info(`Document processed: ${documentId}`);
    
    return {
      success: true,
      data: document
    };
  } catch (error) {
    logger.error('Document processing failed:', error.message);
    
    // Re-fetch document to ensure it's available for error logging
    const document = await RAGDocument.findById(documentId);
    if (document) {
      await document.setProcessingError(error.message);
    }
    
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
    
    let filterQuery = { status: 'indexed' };
    if (documentIds && documentIds.length > 0) {
      filterQuery._id = { $in: documentIds.map(id => typeof id === 'string' ? require('mongoose').Types.ObjectId(id) : id) };
    } else {
      const personalDocs = await RAGDocument.find({ user_id: userId, status: 'indexed' });
      
      const userGroups = await DocumentGroup.find({
        $or: [
          { owner_id: userId },
          { 'members.user_id': userId }
        ]
      });
      
      const groupDocIds = [];
      for (const group of userGroups) {
        for (const docRef of group.documents) {
          if (!groupDocIds.includes(docRef.document_id.toString())) {
            groupDocIds.push(docRef.document_id);
          }
        }
      }
      
      let accessibleDocs = [...personalDocs];
      if (groupDocIds.length > 0) {
        const groupDocs = await RAGDocument.find({ _id: { $in: groupDocIds }, status: 'indexed' });
        accessibleDocs = [...personalDocs, ...groupDocs];
      }
      
      const uniqueDocsMap = new Map();
      for (const doc of accessibleDocs) {
        uniqueDocsMap.set(doc._id.toString(), doc);
      }
      
      filterQuery._id = { $in: Array.from(uniqueDocsMap.keys()) };
    }
    
    const documents = await RAGDocument.find(filterQuery);
    
    const allResults = [];
    const sourcesMap = new Map();
    
    for (const doc of documents) {
      let maxSimilarity = 0;
      
      for (const chunk of doc.chunked_content || []) {
        if (chunk.embedding && chunk.embedding.length === queryVector.length) {
          const similarity = cosineSimilarity(queryVector, chunk.embedding);
          if (similarity > 0.1) {
            allResults.push({
              text: chunk.text,
              document_id: doc._id.toString(),
              filename: doc.filename,
              file_type: doc.file_type,
              chunk_index: chunk.chunk_index,
              similarity,
              sheet_name: doc.metadata?.sheets?.[chunk.chunk_index] || null
            });
          }
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }
      
      if (!sourcesMap.has(doc._id.toString())) {
        sourcesMap.set(doc._id.toString(), {
          document_id: doc._id.toString(),
          filename: doc.filename,
          file_type: doc.file_type,
          total_chunks_used: 0,
          sheets: doc.metadata?.sheets || []
        });
      }
    }
    
    const sortedResults = allResults.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
    
    for (const result of sortedResults) {
      const source = sourcesMap.get(result.document_id);
      if (source) source.total_chunks_used += 1;
    }
    
    return {
      success: true,
      data: {
        results: sortedResults,
        sources: Array.from(sourcesMap.values())
      }
    };
  } catch (error) {
    logger.error('Document search failed:', error.message);
    throw error;
  }
};

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
};

const deleteDocument = async (documentId) => {
  try {
    const document = await RAGDocument.findByIdAndDelete(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
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
    const documents = await RAGDocument.find({ user_id: userId })
      .sort({ uploaded_at: -1 });
    
    return {
      success: true,
      data: documents
    };
  } catch (error) {
    logger.error('Get user documents failed:', error.message);
    throw error;
  }
};

const getDocumentById = async (documentId) => {
  try {
    const document = await RAGDocument.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    return {
      success: true,
      data: document
    };
  } catch (error) {
    logger.error('Get document failed:', error.message);
    throw error;
  }
};

const getChunks = async (documentId, userId, options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;
    const document = await RAGDocument.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    const chunks = document.chunked_content || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedChunks = chunks.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: {
        chunks: paginatedChunks,
        total: chunks.length,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  } catch (error) {
    logger.error('Get chunks failed:', error.message);
    throw error;
  }
};

const updateSettings = async (documentId, userId, settings) => {
  try {
    const document = await RAGDocument.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    document.metadata = {
      ...document.metadata,
      ...settings
    };
    
    await document.save();
    
    return {
      success: true,
      data: document
    };
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
  cosineSimilarity,
  deleteDocument,
  getDocumentsByUser,
  getDocumentById,
  getChunks,
  updateSettings
};
