const { getDB } = require('../config/db');
const logger = require('../utils/logger');
const roleService = require('./roleService');

const knex = () => getDB();

// Helper: add document to group documents array
const addDocumentToGroupDocs = async (groupId, docData) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) throw new Error('Document group not found');

  let documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
  documents.push(docData);
  await knex().from('document_groups').where({ id: groupId }).update({ documents: JSON.stringify(documents) });
  return { ...group, documents };
};

// Helper: remove document from group documents array
const removeDocumentFromGroupDocs = async (groupId, docIndex) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) throw new Error('Document group not found');

  let documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
  documents.splice(docIndex, 1);
  await knex().from('document_groups').where({ id: groupId }).update({ documents: JSON.stringify(documents) });
  return { ...group, documents };
};

const createGroup = async (userId, name, description = '', roles = ['user']) => {
  try {
    const id = require('uuid').v4();

    let effectiveRoles = ['user'];
    if (Array.isArray(roles) && roles.length > 0) {
      effectiveRoles = roles;
    }

    await knex().from('document_groups').insert({
      id,
      name,
      description,
      owner_id: userId,
      roles: JSON.stringify(effectiveRoles),
    });

    const group = await knex().from('document_groups').where({ id }).first();

    logger.info(`Document group created: ${group.id} by user ${userId}`);

    return { success: true, data: group };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
      throw new Error('A group with this name already exists for your account');
    }
    logger.error('Create group failed:', error.message);
    throw error;
  }
};

const updateGroup = async (groupId, userId, updateData) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Insufficient permissions to edit this group');
    }

    const allowedFields = ['name', 'description', 'roles'];
    const updates = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'roles') {
          if (!Array.isArray(updateData[field]) || updateData[field].length === 0) {
            throw new Error('Roles must be a non-empty array');
          }
          for (const role of updateData[field]) {
            const valid = await roleService.isValidRole(role);
            if (!valid) {
              throw new Error(`Invalid role: ${role}`);
            }
          }
          updates[field] = JSON.stringify(updateData[field]);
        } else {
          updates[field] = updateData[field];
        }
      }
    }
    updates.updated_at = new Date();

    await knex().from('document_groups').where({ id: groupId }).update(updates);
    const updatedGroup = await knex().from('document_groups').where({ id: groupId }).first();

    logger.info(`Document group updated: ${groupId} by user ${userId}`);

    return { success: true, data: updatedGroup };
  } catch (error) {
    logger.error('Update group failed:', error.message);
    throw error;
  }
};

const deleteGroup = async (groupId, userId) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Only the owner or admin can delete this group');
    }

    await knex().from('document_groups').where({ id: groupId }).del();

    logger.info(`Document group deleted: ${groupId} by user ${userId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete group failed:', error.message);
    throw error;
  }
};

const transferOwnership = async (groupId, userId, newOwnerId, newOwnerRoles) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Only the owner or admin can transfer ownership');
    }

    if (group.owner_id === newOwnerId) {
      throw new Error('User is already the owner');
    }

    const newOwner = await knex().from('users').where({ id: newOwnerId }).first();
    if (!newOwner) throw new Error('New owner not found');

    const groupRoles = typeof group.roles === 'string' ? JSON.parse(group.roles) : (group.roles || []);
    const checkRoles = newOwnerRoles || newOwner.roles;
    const hasAccess = groupRoles.some(r => checkRoles.includes(r));
    if (!hasAccess) {
      throw new Error('New owner does not have access to this group');
    }

    await knex().from('document_groups')
      .where({ id: groupId })
      .update({
        owner_id: newOwnerId,
        updated_at: new Date(),
      });

    const updatedGroup = await knex().from('document_groups').where({ id: groupId }).first();

    logger.info(`Ownership transferred in group ${groupId}: from ${userId} to ${newOwnerId}`);

    return { success: true, data: updatedGroup };
  } catch (error) {
    logger.error('Transfer ownership failed:', error.message);
    throw error;
  }
};

const addDocumentToGroup = async (groupId, userId, documentId) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Insufficient permissions to add documents');
    }

    const document = await knex().from('rag_documents').where({ id: documentId }).first();
    if (!document) throw new Error('Document not found');

    if (document.user_id !== userId) {
      throw new Error('You can only add your own documents to groups');
    }

    let documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
    const alreadyExists = documents.some(d => d.document_id === documentId);
    if (alreadyExists) {
      throw new Error('Document is already in this group');
    }

    await addDocumentToGroupDocs(groupId, {
      document_id: documentId,
      added_by: userId,
      added_at: new Date(),
    });

    logger.info(`Document ${documentId} added to group ${groupId} by user ${userId}`);

    return { success: true, data: group };
  } catch (error) {
    logger.error('Add document to group failed:', error.message);
    throw error;
  }
};

const removeDocumentFromGroup = async (groupId, userId, documentId) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Insufficient permissions to remove documents');
    }

    let documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
    const docIndex = documents.findIndex(d => d.document_id === documentId);
    if (docIndex === -1) {
      throw new Error('Document is not in this group');
    }

    await removeDocumentFromGroupDocs(groupId, docIndex);

    logger.info(`Document ${documentId} removed from group ${groupId} by user ${userId}`);

    return { success: true, data: group };
  } catch (error) {
    logger.error('Remove document from group failed:', error.message);
    throw error;
  }
};

const getGroupAccessibleDocuments = async (userId, userRoles) => {
  try {
    const personalDocs = await knex().from('rag_documents')
      .where({ user_id: userId, status: 'indexed' });

    const userGroups = await knex().from('document_groups')
      .whereRaw('JSON_OVERLAPS(roles, ?)', [JSON.stringify(userRoles || [])]);

    const groupDocIds = [];
    for (const group of userGroups) {
      const documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
      for (const docRef of documents) {
        if (!groupDocIds.includes(docRef.document_id)) {
          groupDocIds.push(docRef.document_id);
        }
      }
    }

    const groupDocs = groupDocIds.length > 0
      ? await knex().from('rag_documents')
          .whereIn('id', groupDocIds)
          .where({ status: 'indexed' })
      : [];

    const allDocsMap = new Map();
    for (const doc of personalDocs) {
      allDocsMap.set(doc.id, { ...doc, source: 'personal' });
    }
    for (const doc of groupDocs) {
      if (!allDocsMap.has(doc.id)) {
        allDocsMap.set(doc.id, { ...doc, source: 'group' });
      }
    }

    const result = Array.from(allDocsMap.values());

    return { success: true, data: result };
  } catch (error) {
    logger.error('Get accessible documents failed:', error.message);
    throw error;
  }
};

const getUserGroups = async (userRoles) => {
  try {
    const groups = await knex().from('document_groups')
      .whereRaw('JSON_OVERLAPS(roles, ?)', [JSON.stringify(userRoles || [])])
      .orderBy('created_at', 'desc');

    return { success: true, data: groups };
  } catch (error) {
    logger.error('Get user groups failed:', error.message);
    throw error;
  }
};

const getGroupDocuments = async (groupId) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const documents = typeof group.documents === 'string' ? JSON.parse(group.documents) : (group.documents || []);
    const docIds = documents.map(d => d.document_id);

    if (docIds.length === 0) return { success: true, data: [] };

    const docs = await knex().from('rag_documents')
      .whereIn('id', docIds)
      .select('id', 'filename', 'file_type', 'status', 'metadata');

    return { success: true, data: docs };
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
  transferOwnership,
  addDocumentToGroup,
  removeDocumentFromGroup,
  getGroupAccessibleDocuments,
  getGroupDocuments,
};
