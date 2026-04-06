const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', authMiddleware, userController.logout);
router.get('/me', authMiddleware, userController.getProfile);
router.put('/me', authMiddleware, userController.updateProfile);
router.delete('/me', authMiddleware, userController.deleteProfile);

router.use(authMiddleware, rbac.requireAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.get('/:userId', userController.getUserById);
router.put('/:id', userController.updateUser);
router.put('/:userId', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.delete('/:userId', userController.deleteUser);
router.patch('/:id/role', userController.updateUserRole);
router.patch('/:userId/role', userController.updateUserRole);

module.exports = router;
