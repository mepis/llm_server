const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const promptController = require('../controllers/promptController');

router.post('/', authMiddleware, promptController.createPrompt);
router.get('/', authMiddleware, promptController.getUserPrompts);
router.get('/:promptId', authMiddleware, promptController.getPrompt);
router.put('/:promptId', authMiddleware, promptController.updatePrompt);
router.delete('/:promptId', authMiddleware, promptController.deletePrompt);
router.post('/execute', authMiddleware, promptController.executePrompt);

module.exports = router;
