const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const chatController = require('../controllers/chatController');

router.post('/', authMiddleware, chatController.createSession);
router.get('/', authMiddleware, chatController.getUserSessions);
router.get('/:id', authMiddleware, chatController.getSession);
router.get('/:sessionId', authMiddleware, chatController.getSession);
router.put('/:id', authMiddleware, chatController.updateSession);
router.put('/:sessionId', authMiddleware, chatController.updateSession);
router.delete('/:id', authMiddleware, chatController.deleteSession);
router.delete('/:sessionId', authMiddleware, chatController.deleteSession);
router.post('/:id/messages', authMiddleware, chatController.addMessage);
router.post('/:sessionId/messages', authMiddleware, chatController.addMessage);
router.get('/:id/messages', authMiddleware, chatController.getMessages);
router.get('/:sessionId/messages', authMiddleware, chatController.getMessages);
router.post('/:id/llm', authMiddleware, chatController.sendToLLM);
router.post('/:sessionId/llm', authMiddleware, chatController.sendToLLM);
router.delete('/:id/messages', authMiddleware, chatController.clearMessages);
router.delete('/:sessionId/messages', authMiddleware, chatController.clearMessages);
router.post('/:id/memory', authMiddleware, chatController.updateMemory);
router.post('/:sessionId/memory', authMiddleware, chatController.updateMemory);
router.put('/:id/memory', authMiddleware, chatController.updateMemory);
router.put('/:sessionId/memory', authMiddleware, chatController.updateMemory);
router.get('/:id/tool-calls', authMiddleware, chatController.getToolCalls);
router.get('/:sessionId/tool-calls', authMiddleware, chatController.getToolCalls);
router.get('/:id/tool-calls/:toolCallId', authMiddleware, chatController.getToolCall);
router.get(
  '/:sessionId/tool-calls/:toolCallId',
  authMiddleware,
  chatController.getToolCall
);

module.exports = router;
