const RAGDocument = require('../models/RAGDocument');
const llamaService = require('./llamaService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const uploadDocument = async (userId, fileBuffer, filename, options = {}) => {
  try {
    const { description, tags = [] } = options;
    
    const fileExtension = path.extname(filename).toLowerCase().slice(1);
    const validExtensions = ['pdf', 'txt', 'doc', 'docx', 'md', 'json', 'csv'];
    
    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type');
    }
    
    const fileDir = path.join(__dirname, '..', '..', 'uploads', 'documents');
    const filePath = path.join(fileDir, `${Date.now()}-${filename}`);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    const fileContent = fileBuffer.toString('utf8');
    
    const document = await RAGDocument.create({
      user_id: userId,
      filename,
      file_type: fileExtension,
      file_size: fileBuffer.length,
      file_path: filePath,
      content: fileContent,
      metadata: {
        description,
        tags
      },
      status: 'processing'
    });
    
    logger.info(`Document uploaded: ${document._id} by user ${userId}`);
    
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
    
    const embeddings = [];
    
    for (const chunk of chunks) {
      const embeddingResponse = await llamaService.getEmbeddings(chunk);
      const embedding = embeddingResponse.data[0]?.embedding;
      
      if (embedding) {
        embeddings.push(embedding);
        await document.addChunk({
          text: chunk,
          embedding,
          chunk_index: embeddings.length - 1
        });
      }
    }
    
    await document.setEmbeddings(embeddings);
    
    logger.info(`Document processed: ${documentId}`);
    
    return {
      success: true,
      data: document
    };
  } catch (error) {
    logger.error('Document processing failed:', error.message);
    await document.setProcessingError(error.message);
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

const searchDocuments = async (userId, query, limit = 10) => {
  try {
    const queryEmbedding = await llamaService.getEmbeddings(query);
    const queryVector = queryEmbedding.data[0]?.embedding;
    
    if (!queryVector) {
      throw new Error('Failed to generate query embedding');
    }
    
    const documents = await RAGDocument.find({
      user_id: userId,
      status: 'indexed'
    });
    
    const scoredDocuments = documents.map(doc => {
      let maxSimilarity = 0;
      
      for (const chunk of doc.chunked_content || []) {
        if (chunk.embedding && chunk.embedding.length === queryVector.length) {
          const similarity = cosineSimilarity(queryVector, chunk.embedding);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }
      
      return { ...doc.toObject(), similarity: maxSimilarity };
    });
    
    return {
      success: true,
      data: scoredDocuments
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
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
