const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const toolController = require('../controllers/toolController');

router.post('/', authMiddleware, toolController.createTool);
router.get('/', authMiddleware, toolController.getUserTools);
router.get('/:toolId', authMiddleware, toolController.getTool);
router.put('/:toolId', authMiddleware, toolController.updateTool);
router.delete('/:toolId', authMiddleware, toolController.deleteTool);
router.post('/call/:toolId', authMiddleware, toolController.callTool);

module.exports = router;
