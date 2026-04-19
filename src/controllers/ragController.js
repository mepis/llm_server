const ragService = require('../services/ragService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/json',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }
    
    const result = await ragService.uploadDocument(userId, file.buffer, file.originalname);
    
    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Upload document failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await ragService.getDocumentsByUser(userId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get user documents failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getDocument = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    const result = await ragService.getDocumentById(documentId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get document failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    await ragService.deleteDocument(documentId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete document failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const processDocument = async (req, res) => {
  try {
    const documentId = req.params.documentId;
    
    const result = await ragService.processDocument(documentId);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Process document failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const searchDocuments = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { query, top_k, filter_document_ids } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const result = await ragService.searchDocuments(userId, query, top_k || 10);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Search documents failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getChunks = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const documentId = req.params.documentId;
    const { page, limit } = req.query;
    
    const result = await ragService.getChunks(documentId, userId, { page, limit });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Get chunks failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const documentId = req.params.documentId;
    const settings = req.body;
    
    const result = await ragService.updateSettings(documentId, userId, settings);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Update settings failed:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  processDocument,
  searchDocuments,
  getChunks,
  updateSettings
};
