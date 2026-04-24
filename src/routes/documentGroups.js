const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const documentGroupController = require('../controllers/documentGroupController');

router.post('/', authMiddleware, documentGroupController.createGroup);
router.get('/', authMiddleware, documentGroupController.getGroups);
router.get('/:id', authMiddleware, documentGroupController.getGroup);
router.patch('/:id', authMiddleware, documentGroupController.updateGroup);
router.delete('/:id', authMiddleware, documentGroupController.deleteGroup);
router.post('/:id/members', authMiddleware, documentGroupController.addMember);
router.delete('/:id/members/:uid', authMiddleware, documentGroupController.removeMember);
router.post('/:id/transfer', authMiddleware, documentGroupController.transferOwnership);
router.post('/:id/documents', authMiddleware, documentGroupController.addDocumentToGroup);
router.delete('/:id/documents/:did', authMiddleware, documentGroupController.removeDocumentFromGroup);
router.get('/accessible', authMiddleware, documentGroupController.getAccessibleDocs);

module.exports = router;
