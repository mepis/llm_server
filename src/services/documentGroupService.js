const DocumentGroup = require('../models/DocumentGroup');
const RAGDocument = require('../models/RAGDocument');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const createGroup = async (userId, name, description = '', visibility = 'private') => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const group = await DocumentGroup.create([{
        name,
        description,
        owner_id: userId,
        visibility,
        members: [{ user_id: userId, role: 'owner' }]
      }], { session });

      await session.commitTransaction();

      logger.info(`Document group created: ${group[0]._id} by user ${userId}`);

      return {
        success: true,
        data: group[0]
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('A group with this name already exists for your account');
    }
    logger.error('Create group failed:', error.message);
    throw error;
  }
};

const updateGroup = async (groupId, userId, updateData) => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    if (!group.canEdit(userId)) {
      throw new Error('Insufficient permissions to edit this group');
    }

    const allowedFields = ['name', 'description', 'visibility'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        group[field] = updateData[field];
      }
    }

    await group.save();

    logger.info(`Document group updated: ${groupId} by user ${userId}`);

    return {
      success: true,
      data: group
    };
  } catch (error) {
    logger.error('Update group failed:', error.message);
    throw error;
  }
};

const deleteGroup = async (groupId, userId) => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    if (!group.isOwner(userId)) {
      throw new Error('Only the owner can delete this group');
    }

    await DocumentGroup.findByIdAndDelete(groupId);

    logger.info(`Document group deleted: ${groupId} by user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete group failed:', error.message);
    throw error;
  }
};

const addMember = async (groupId, userId, memberUserId, role = 'viewer') => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    if (!group.isOwner(userId)) {
      throw new Error('Only the owner can add members');
    }

    if (role === 'owner') {
      throw new Error('Cannot assign owner role; only the creator can be owner');
    }

    const userExists = await User.findById(memberUserId);
    if (!userExists) {
      throw new Error('User not found');
    }

    const alreadyMember = group.members.some(m => m.user_id.toString() === memberUserId.toString());
    if (alreadyMember) {
      throw new Error('User is already a member of this group');
    }

    group.members.push({ user_id: memberUserId, role });
    await group.save();

    logger.info(`Member added to group ${groupId}: user ${memberUserId} as ${role}`);

    return {
      success: true,
      data: group
    };
  } catch (error) {
    logger.error('Add member failed:', error.message);
    throw error;
  }
};

const removeMember = async (groupId, userId, memberUserId) => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    const isOwner = group.isOwner(userId);
    const isSelfRemoval = userId === memberUserId;

    if (!isOwner && !isSelfRemoval) {
      throw new Error('Only the owner can remove members, or users can remove themselves');
    }

    if (isOwner && group.isOwner(memberUserId)) {
      throw new Error('Cannot remove yourself as owner. Transfer ownership first.');
    }

    const memberIndex = group.members.findIndex(m => m.user_id.toString() === memberUserId.toString());
    if (memberIndex === -1) {
      throw new Error('User is not a member of this group');
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    logger.info(`Member removed from group ${groupId}: user ${memberUserId}`);

    return {
      success: true,
      data: group
    };
  } catch (error) {
    logger.error('Remove member failed:', error.message);
    throw error;
  }
};

const transferOwnership = async (groupId, userId, newOwnerId) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const group = await DocumentGroup.findById(groupId).session(session);

      if (!group) {
        throw new Error('Document group not found');
      }

      if (!group.isOwner(userId)) {
        throw new Error('Only the owner can transfer ownership');
      }

      if (group.isOwner(newOwnerId)) {
        throw new Error('User is already the owner');
      }

      const isNewMember = group.members.some(m => m.user_id.toString() === newOwnerId.toString());
      if (!isNewMember) {
        throw new Error('New owner must already be a member of this group');
      }

      group.owner_id = newOwnerId;

      const oldOwnerIndex = group.members.findIndex(m => m.user_id.toString() === userId.toString());
      if (oldOwnerIndex !== -1) {
        group.members[oldOwnerIndex].role = 'viewer';
      } else {
        group.members.push({ user_id: userId, role: 'viewer' });
      }

      const newOwnerMemberIndex = group.members.findIndex(m => m.user_id.toString() === newOwnerId.toString());
      if (newOwnerMemberIndex !== -1) {
        group.members[newOwnerMemberIndex].role = 'owner';
      } else {
        group.members.push({ user_id: newOwnerId, role: 'owner' });
      }

      await group.save({ session });

      await session.commitTransaction();

      logger.info(`Ownership transferred in group ${groupId}: from ${userId} to ${newOwnerId}`);

      return {
        success: true,
        data: group
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('Transfer ownership failed:', error.message);
    throw error;
  }
};

const addDocumentToGroup = async (groupId, userId, documentId) => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    if (!group.canEdit(userId)) {
      throw new Error('Insufficient permissions to add documents');
    }

    const document = await RAGDocument.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id.toString() !== userId.toString()) {
      throw new Error('You can only add your own documents to groups');
    }

    const alreadyExists = group.documents.some(d => d.document_id.toString() === documentId.toString());
    if (alreadyExists) {
      throw new Error('Document is already in this group');
    }

    group.documents.push({
      document_id: documentId,
      added_by: userId,
      added_at: new Date()
    });

    await group.save();

    logger.info(`Document ${documentId} added to group ${groupId} by user ${userId}`);

    return {
      success: true,
      data: group
    };
  } catch (error) {
    logger.error('Add document to group failed:', error.message);
    throw error;
  }
};

const removeDocumentFromGroup = async (groupId, userId, documentId) => {
  try {
    const group = await DocumentGroup.findById(groupId);

    if (!group) {
      throw new Error('Document group not found');
    }

    if (!group.canEdit(userId)) {
      throw new Error('Insufficient permissions to remove documents');
    }

    const docIndex = group.documents.findIndex(d => d.document_id.toString() === documentId.toString());
    if (docIndex === -1) {
      throw new Error('Document is not in this group');
    }

    group.documents.splice(docIndex, 1);
    await group.save();

    logger.info(`Document ${documentId} removed from group ${groupId} by user ${userId}`);

    return {
      success: true,
      data: group
    };
  } catch (error) {
    logger.error('Remove document from group failed:', error.message);
    throw error;
  }
};

const getGroupAccessibleDocuments = async (userId) => {
  try {
    const personalDocs = await RAGDocument.find({
      user_id: userId,
      status: 'indexed'
    });

    const userGroups = await DocumentGroup.find({
      $or: [
        { owner_id: userId },
        { 'members.user_id': userId }
      ]
    });

    const groupDocIds = [];
    for (const group of userGroups) {
      for (const docRef of group.documents) {
        if (!groupDocIds.includes(docRef.document_id.toString())) {
          groupDocIds.push(docRef.document_id);
        }
      }
    }

    const groupDocs = groupDocIds.length > 0
      ? await RAGDocument.find({ _id: { $in: groupDocIds }, status: 'indexed' })
      : [];

    const allDocsMap = new Map();
    for (const doc of personalDocs) {
      allDocsMap.set(doc._id.toString(), { ...doc.toObject(), source: 'personal' });
    }
    for (const doc of groupDocs) {
      if (!allDocsMap.has(doc._id.toString())) {
        allDocsMap.set(doc._id.toString(), { ...doc.toObject(), source: 'group' });
      }
    }

    const result = Array.from(allDocsMap.values());

    return {
      success: true,
      data: result
    };
  } catch (error) {
    logger.error('Get accessible documents failed:', error.message);
    throw error;
  }
};

const getUserGroups = async (userId) => {
  try {
    const groups = await DocumentGroup.find({
      $or: [
        { owner_id: userId },
        { 'members.user_id': userId }
      ]
    }).sort({ created_at: -1 });

    return {
      success: true,
      data: groups
    };
  } catch (error) {
    logger.error('Get user groups failed:', error.message);
    throw error;
  }
};

const getGroupDocuments = async (groupId) => {
  try {
    const group = await DocumentGroup.findById(groupId).populate({
      path: 'documents.document_id',
      select: 'filename file_type status metadata'
    });

    if (!group) {
      throw new Error('Document group not found');
    }

    return {
      success: true,
      data: group.documents.map(doc => doc.document_id || null).filter(Boolean)
    };
  } catch (error) {
    logger.error('Get group documents failed:', error.message);
    throw error;
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  transferOwnership,
  addDocumentToGroup,
  removeDocumentFromGroup,
  getGroupAccessibleDocuments,
  getGroupDocuments
};
