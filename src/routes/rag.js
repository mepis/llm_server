const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const ragController = require('../controllers/ragController');

router.post('/documents', authMiddleware, ragController.upload.single('file'), ragController.uploadDocument);
router.get('/documents', authMiddleware, ragController.getUserDocuments);
router.get('/documents/:documentId', authMiddleware, ragController.getDocument);
router.delete('/documents/:documentId', authMiddleware, ragController.deleteDocument);
router.post('/documents/:documentId/process', authMiddleware, ragController.processDocument);
router.post('/search', authMiddleware, ragController.searchDocuments);
router.post('/documents/:documentId/chunks', authMiddleware, ragController.getChunks);
router.patch('/documents/:documentId/settings', authMiddleware, ragController.updateSettings);

module.exports = router;
