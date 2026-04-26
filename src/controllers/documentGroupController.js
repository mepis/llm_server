const documentGroupService = require('../services/documentGroupService');
const logger = require('../utils/logger');

const createGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, description, visibility } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Group name is required' });
    const validVisibilities = ['private', 'team', 'public'];
    const result = await documentGroupService.createGroup(userId, name.trim(), description || '', validVisibilities.includes(visibility) ? visibility : 'private');
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create group failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getGroups = async (req, res) => {
  try {
    const result = await documentGroupService.getUserGroups(req.user.user_id);
    res.json(result);
  } catch (error) {
    logger.error('Get groups failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const groups = await documentGroupService.getUserGroups(userId);
    const foundGroup = groups.data.find(g => g.id === groupId);
    if (!foundGroup) return res.status(404).json({ success: false, error: 'Group not found or you do not have access' });
    const docResult = await documentGroupService.getGroupDocuments(groupId);
    res.json({ success: true, data: { ...foundGroup, documents: docResult.data } });
  } catch (error) {
    logger.error('Get group failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const result = await documentGroupService.updateGroup(req.params.id, req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update group failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const result = await documentGroupService.deleteGroup(req.params.id, req.user.user_id);
    res.json(result);
  } catch (error) {
    logger.error('Delete group failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(403).json({ success: false, error: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { user_id: memberUserId, role } = req.body;
    if (!memberUserId) return res.status(400).json({ success: false, error: 'Member user_id is required' });
    const result = await documentGroupService.addMember(req.params.id, req.user.user_id, memberUserId, role || 'viewer');
    res.json(result);
  } catch (error) {
    logger.error('Add member failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const result = await documentGroupService.removeMember(req.params.id, req.user.user_id, req.params.uid);
    res.json(result);
  } catch (error) {
    logger.error('Remove member failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const transferOwnership = async (req, res) => {
  try {
    const { new_owner_id } = req.body;
    if (!new_owner_id) return res.status(400).json({ success: false, error: 'New owner user_id is required' });
    const result = await documentGroupService.transferOwnership(req.params.id, req.user.user_id, new_owner_id);
    res.json(result);
  } catch (error) {
    logger.error('Transfer ownership failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const addDocumentToGroup = async (req, res) => {
  try {
    const { document_id } = req.body;
    if (!document_id) return res.status(400).json({ success: false, error: 'Document ID is required' });
    const result = await documentGroupService.addDocumentToGroup(req.params.id, req.user.user_id, document_id);
    res.json(result);
  } catch (error) {
    logger.error('Add document to group failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const removeDocumentFromGroup = async (req, res) => {
  try {
    const result = await documentGroupService.removeDocumentFromGroup(req.params.id, req.user.user_id, req.params.did);
    res.json(result);
  } catch (error) {
    logger.error('Remove document from group failed:', error.message);
    if (error.message.includes('not found')) return res.status(404).json({ success: false, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
};

const getAccessibleDocs = async (req, res) => {
  try {
    const result = await documentGroupService.getGroupAccessibleDocuments(req.user.user_id);
    res.json(result);
  } catch (error) {
    logger.error('Get accessible docs failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createGroup, getGroups, getGroup, updateGroup, deleteGroup, addMember, removeMember, transferOwnership, addDocumentToGroup, removeDocumentFromGroup, getAccessibleDocs };
