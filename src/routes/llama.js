const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const llamaController = require('../controllers/llamaController');

router.get('/models', authMiddleware, llamaController.getModels);
router.post('/chat/completions', authMiddleware, llamaController.createChatCompletion);
router.post('/embeddings', authMiddleware, llamaController.createEmbedding);
router.post('/tts', authMiddleware, llamaController.generateAudio);
router.get('/health', llamaController.getHealth);

module.exports = router;
