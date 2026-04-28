const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const llamaController = require('../controllers/llamaController');
const llamaService = require('../services/llamaService');
const logger = require('../utils/logger');

router.get('/models', authMiddleware, llamaController.getModels);
router.post('/chat/completions', authMiddleware, llamaController.createChatCompletion);
router.post('/embeddings', authMiddleware, llamaController.createEmbedding);
router.post('/tts', authMiddleware, llamaController.generateAudio);
router.get('/tts/speakers', authMiddleware, async (req, res) => {
  try {
    const speakers = await llamaService.getSpeakers();
    res.json({ success: true, data: speakers });
  } catch (error) {
    logger.error(`Failed to fetch speakers: ${error.message}`);
    if (error.message.includes('unreachable')) {
      res.status(502).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});
router.get('/health', llamaController.getHealth);

module.exports = router;
