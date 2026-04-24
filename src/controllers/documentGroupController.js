const documentGroupService = require('../services/documentGroupService');
const logger = require('../utils/logger');

const createGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, description, visibility } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    const validVisibilities = ['private', 'team', 'public'];
    const groupVisibility = validVisibilities.includes(visibility) ? visibility : 'private';
    const result = await documentGroupService.createGroup(userId, name.trim(), description || '', groupVisibility);

    res.status(201).json(result);
  } catch (error) {
    logger.error('Create group failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await documentGroupService.getUserGroups(userId);

    res.json(result);
  } catch (error) {
    logger.error('Get groups failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;

    const group = await documentGroupService.getUserGroups(userId);
    const foundGroup = group.data.find(g => g._id.toString() === groupId);

    if (!foundGroup) {
      return res.status(404).json({
        success: false,
        error: 'Group not found or you do not have access'
      });
    }

    const docResult = await documentGroupService.getGroupDocuments(groupId);

    res.json({
      success: true,
      data: { ...foundGroup.toObject(), documents: docResult.data }
    });
  } catch (error) {
    logger.error('Get group failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const updateData = req.body;

    const result = await documentGroupService.updateGroup(groupId, userId, updateData);

    res.json(result);
  } catch (error) {
    logger.error('Update group failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;

    const result = await documentGroupService.deleteGroup(groupId, userId);

    res.json(result);
  } catch (error) {
    logger.error('Delete group failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(403).json({
      success: false,
      error: error.message
    });
  }
};

const addMember = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const { user_id: memberUserId, role } = req.body;

    if (!memberUserId) {
      return res.status(400).json({
        success: false,
        error: 'Member user_id is required'
      });
    }

    const result = await documentGroupService.addMember(groupId, userId, memberUserId, role || 'viewer');

    res.json(result);
  } catch (error) {
    logger.error('Add member failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const memberUserId = req.params.uid;

    const result = await documentGroupService.removeMember(groupId, userId, memberUserId);

    res.json(result);
  } catch (error) {
    logger.error('Remove member failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const transferOwnership = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const { new_owner_id } = req.body;

    if (!new_owner_id) {
      return res.status(400).json({
        success: false,
        error: 'New owner user_id is required'
      });
    }

    const result = await documentGroupService.transferOwnership(groupId, userId, new_owner_id);

    res.json(result);
  } catch (error) {
    logger.error('Transfer ownership failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const addDocumentToGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
    }

    const result = await documentGroupService.addDocumentToGroup(groupId, userId, document_id);

    res.json(result);
  } catch (error) {
    logger.error('Add document to group failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const removeDocumentFromGroup = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const groupId = req.params.id;
    const documentId = req.params.did;

    const result = await documentGroupService.removeDocumentFromGroup(groupId, userId, documentId);

    res.json(result);
  } catch (error) {
    logger.error('Remove document from group failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getAccessibleDocs = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await documentGroupService.getGroupAccessibleDocuments(userId);

    res.json(result);
  } catch (error) {
    logger.error('Get accessible docs failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  transferOwnership,
  addDocumentToGroup,
  removeDocumentFromGroup,
  getAccessibleDocs
};
