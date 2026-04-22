const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validation = require('../middleware/validation');

const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.delete('/me', userController.deleteProfile);

router.use(rbac.requireAdmin);

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:userId', validation.validateUserId, userController.getUserById);
router.put('/:userId', validation.validateUserId, userController.updateUser);
router.delete('/:userId', validation.validateUserId, userController.deleteUser);
router.patch('/:userId/role', validation.validateUserId, userController.updateUserRole);

module.exports = router;
