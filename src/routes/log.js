const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const logController = require('../controllers/logController');

router.get('/', authMiddleware, rbac.requireAdmin, logController.getLogs);
router.get('/level/:level', authMiddleware, rbac.requireAdmin, logController.getLogsByLevel);
router.get('/user/:userId', authMiddleware, logController.getUserLogs);
router.get('/range', authMiddleware, rbac.requireAdmin, logController.getLogsByDateRange);
router.get('/stats', authMiddleware, rbac.requireAdmin, logController.getLogStats);
router.get('/system/monitor', authMiddleware, rbac.requireAdmin, logController.getSystemMonitor);

module.exports = router;
