const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const configController = require('../controllers/configController');

router.get('/', authMiddleware, rbac.requireAdmin, configController.getAllSettings);
router.get('/reset', authMiddleware, rbac.requireAdmin, configController.resetToEnvDefaults);
router.get('/:key', authMiddleware, configController.getSetting);
router.patch('/:key', authMiddleware, rbac.requireAdmin, configController.updateSetting);

module.exports = router;
