const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const userRoutes = require('./user');
const chatRoutes = require('./chat');
const ragRoutes = require('./rag');
const promptRoutes = require('./prompt');
const toolRoutes = require('./tool');
const logRoutes = require('./log');
const matrixRoutes = require('./matrix');
const llamaRoutes = require('./llama');
const monitorRoutes = require('./monitor');

router.use('/users', userRoutes);
router.use('/auth', userRoutes);
router.use('/chat', chatRoutes);
router.use('/chats', chatRoutes);
router.use('/rag', ragRoutes);
router.use('/prompts', promptRoutes);
router.use('/tools', toolRoutes);
router.use('/logs', logRoutes);
router.use('/matrix', matrixRoutes);
router.use('/llama', llamaRoutes);
router.use('/monitor', monitorRoutes);

module.exports = router;
