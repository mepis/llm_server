const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const chatController = require('../controllers/chatController');

router.post('/', authMiddleware, chatController.createSession);
router.get('/', authMiddleware, chatController.getUserSessions);
router.get('/:sessionId', authMiddleware, chatController.getSession);
router.put('/:sessionId', authMiddleware, chatController.updateSession);
router.delete('/:sessionId', authMiddleware, chatController.deleteSession);
router.post('/:sessionId/messages', authMiddleware, chatController.addMessage);
router.get('/:sessionId/messages', authMiddleware, chatController.getMessages);
router.post('/:sessionId/llm', authMiddleware, chatController.sendToLLM);
router.delete('/:sessionId/messages', authMiddleware, chatController.clearMessages);
router.post('/:sessionId/memory', authMiddleware, chatController.updateMemory);

module.exports = router;
