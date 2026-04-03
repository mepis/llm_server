const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const ragController = require('../controllers/ragController');

router.post('/', authMiddleware, ragController.uploadDocument);
router.get('/', authMiddleware, ragController.getUserDocuments);
router.get('/:documentId', authMiddleware, ragController.getDocument);
router.delete('/:documentId', authMiddleware, ragController.deleteDocument);
router.post('/:documentId/process', authMiddleware, ragController.processDocument);
router.post('/search', authMiddleware, ragController.searchDocuments);
router.post('/:documentId/chunks', authMiddleware, ragController.getChunks);
router.patch('/:documentId/settings', authMiddleware, ragController.updateSettings);

module.exports = router;
