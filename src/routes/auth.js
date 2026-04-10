const express = require('express');
const router = express.Router();

const validation = require('../middleware/validation');
const userController = require('../controllers/userController');

router.post('/register', validation.validateRegister, userController.register);
router.post('/login', validation.validateLogin, userController.login);
router.post('/logout', userController.logout);

module.exports = router;
