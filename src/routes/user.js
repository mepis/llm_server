const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validation = require('../middleware/validation');

const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.patch('/me', userController.updateProfile);
router.delete('/me', userController.deleteProfile);
router.patch('/me/change-password', userController.changePasswordSelf);

router.use(rbac.requireAdmin);

router.post('/', userController.createUser);
router.get('/', rbac.requireAdmin, userController.getAllUsers);
router.get('/:userId', validation.validateUserId, userController.getUserById);
router.put('/:userId', validation.validateUserId, userController.updateUser);
router.delete('/:userId', validation.validateUserId, userController.deleteUser);
router.patch('/:userId/role', validation.validateUserId, userController.updateUserRole);
router.post('/:userId/reset-password', validation.validateUserId, userController.resetUserPassword);

module.exports = router;
