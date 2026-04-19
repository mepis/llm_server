const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const toolController = require('../controllers/toolController');

router.post('/', authMiddleware, rbac.requireAdmin, toolController.createTool);
router.get('/', authMiddleware, toolController.getAccessibleTools);
router.post('/call/:toolId', authMiddleware, toolController.callTool);
router.get('/:toolId', authMiddleware, toolController.getTool);
router.put('/:toolId', authMiddleware, rbac.requireAdmin, toolController.updateTool);
router.delete('/:toolId', authMiddleware, rbac.requireAdmin, toolController.deleteTool);

module.exports = router;
