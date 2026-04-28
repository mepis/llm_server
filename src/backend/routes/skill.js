const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const skillController = require('../controllers/skillController');

router.get('/', authMiddleware, skillController.listSkills);
router.post('/', authMiddleware, rbac.requireAdmin, skillController.createSkill);
router.get('/:name', authMiddleware, skillController.getSkill);
router.put('/:name', authMiddleware, rbac.requireAdmin, skillController.updateSkill);
router.delete('/:name', authMiddleware, rbac.requireAdmin, skillController.deleteSkill);

module.exports = router;
