const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const authRoutes = require('./auth');
const userRoutes = require('./user');
const chatRoutes = require('./chat');
const ragRoutes = require('./rag');
const promptRoutes = require('./prompt');
const toolRoutes = require('./tool');
const logRoutes = require('./log');
const matrixRoutes = require('./matrix');
const llamaRoutes = require('./llama');
const monitorRoutes = require('./monitor');
const skillRoutes = require('./skill');
const configRoutes = require('./config');
const systemRoutes = require('./system');
const roleRoutes = require('./roles');
const documentGroupRoutes = require('./documentGroups');
const memoryRoutes = require('./memory');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/chats', chatRoutes);
router.use('/rag', ragRoutes);
router.use('/prompts', promptRoutes);
router.use('/tools', toolRoutes);
router.use('/logs', logRoutes);
router.use('/matrix', matrixRoutes);
router.use('/llama', llamaRoutes);
router.use('/monitor', monitorRoutes);
router.use('/skills', skillRoutes);
router.use('/config', configRoutes);
router.use('/system', systemRoutes);
router.use('/roles', roleRoutes);
router.use('/document-groups', documentGroupRoutes);
router.use('/memory', memoryRoutes);

module.exports = router;
