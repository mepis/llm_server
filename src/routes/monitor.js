const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const monitorController = require('../controllers/monitorController');

router.get('/health', authMiddleware, rbac.requireAdmin, monitorController.getHealth);
router.get('/performance', authMiddleware, rbac.requireAdmin, monitorController.getPerformance);

module.exports = router;
