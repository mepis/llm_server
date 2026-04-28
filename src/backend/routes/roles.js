const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const roleController = require('../controllers/roleController');

router.get('/', authMiddleware, rbac.requireAdmin, roleController.getAllRoles);
router.post('/', authMiddleware, rbac.requireAdmin, roleController.createRole);
router.delete('/:name', authMiddleware, rbac.requireAdmin, roleController.deleteRole);

module.exports = router;
