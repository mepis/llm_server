const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const matrixController = require('../controllers/matrixController');

router.get('/status', authMiddleware, rbac.requireSystem, matrixController.getStatus);
router.post('/webhook', matrixController.handleWebhook);
router.post('/send', authMiddleware, rbac.requireSystem, matrixController.sendMessage);
router.get('/messages', authMiddleware, rbac.requireSystem, matrixController.getMessages);
router.post('/process', authMiddleware, rbac.requireSystem, matrixController.processIncomingMessage);

module.exports = router;
