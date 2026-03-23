const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

router.get('/search', (req, res) => modelController.searchModels(req, res));
router.get('/:id', (req, res) => modelController.getModelDetails(req, res));
router.post('/download', (req, res) => modelController.downloadModel(req, res));
router.get('/download/:jobId', (req, res) => modelController.getDownloadStatus(req, res));
router.get('/downloads', (req, res) => modelController.listDownloads(req, res));

module.exports = router;
