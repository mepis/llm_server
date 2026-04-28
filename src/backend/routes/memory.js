const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const memoryController = require('../controllers/memoryController');

router.get('/memories', authMiddleware, memoryController.getMemories);
router.get('/episodic', authMiddleware, memoryController.getEpisodic);
router.get('/semantic', authMiddleware, memoryController.getSemantic);
router.get('/procedural', authMiddleware, memoryController.getProcedural);
router.post('/extract', authMiddleware, memoryController.extractMemories);
router.delete('/:id', authMiddleware, memoryController.deleteMemory);

module.exports = router;
