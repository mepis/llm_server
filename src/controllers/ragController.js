const ragService = require('../services/ragService');
const logger = require('../utils/logger');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'File is required' });
    const result = await ragService.uploadDocument(req.user.user_id, req.file.buffer, req.file.originalname);
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Upload document failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getUserDocuments = async (req, res) => {
  try {
    const result = await ragService.getDocumentsByUser(req.user.user_id);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get user documents failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDocument = async (req, res) => {
  try {
    const result = await ragService.getDocumentById(req.params.documentId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get document failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await ragService.deleteDocument(req.params.documentId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete document failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const processDocument = async (req, res) => {
  try {
    const result = await ragService.processDocument(req.params.documentId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Process document failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const searchDocuments = async (req, res) => {
  try {
    const { query, top_k, filter_document_ids } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });
    const result = await ragService.searchDocuments(req.user.user_id, query, top_k || 10, filter_document_ids);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Search documents failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getChunks = async (req, res) => {
  try {
    const result = await ragService.getChunks(req.params.documentId, req.user.user_id, { page: req.query.page, limit: req.query.limit });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get chunks failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const result = await ragService.updateSettings(req.params.documentId, req.user.user_id, req.body);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Update settings failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

module.exports = { upload: require('multer')({ storage: require('multer').memoryStorage(), limits: { fileSize: 10485760 }, fileFilter: (req, file, cb) => { const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/json', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; if (allowedTypes.includes(file.mimetype)) cb(null, true); else { const ext = require('path').extname(file.originalname).toLowerCase().slice(1); const allowedExt = ['txt', 'md', 'pdf', 'json', 'csv', 'docx', 'xlsx']; allowedExt.includes(ext) ? cb(null, true) : cb(new Error('Invalid file type')); } } }), uploadDocument, getUserDocuments, getDocument, deleteDocument, processDocument, searchDocuments, getChunks, updateSettings };
