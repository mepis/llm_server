const { getDB } = require('../config/db');
const logger = require('../utils/logger');

const knex = () => getDB();

// Helper: check if user is in members JSON array
const findMemberIndex = async (groupId, userId) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) return -1;
  const members = typeof group.members === 'string' ? JSON.parse(group.members) : (group.members || []);
  return members.findIndex(m => m.user_id === userId);
};

// Helper: update a specific member in the members array
const updateMemberInGroup = async (groupId, memberIndex, memberData) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) throw new Error('Document group not found');

  let members = typeof group.members === 'string' ? JSON.parse(group.members) : (group.members || []);
  members[memberIndex] = memberData;
  await knex().from('document_groups').where({ id: groupId }).update({ members: JSON.stringify(members) });
  return { ...group, members };
};

// Helper: add a member to the group
const addMemberToGroup = async (groupId, memberData) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) throw new Error('Document group not found');

  let members = typeof group.members === 'string' ? JSON.parse(group.members) : (group.members || []);
  members.push(memberData);
  await knex().from('document_groups').where({ id: groupId }).update({ members: JSON.stringify(members) });
  return { ...group, members };
};

// Helper: remove member from group array
const removeMemberFromGroup = async (groupId, memberIndex) => {
  const group = await knex().from('document_groups').where({ id: groupId }).first();
  if (!group) throw new Error('Document group not found');

  let members = typeof group.members === 'string' ? JSON.parse(group.members) : (group.members || []);
  members.splice(memberIndex, 1);
  await knex().from('document_groups').where({ id: groupId }).update({ members: JSON.stringify(members) });
  return { ...group, members };
};

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

const createGroup = async (userId, name, description = '', visibility = 'private') => {
  try {
    const id = require('uuid').v4();
    await knex().transaction(async (trx) => {
      await trx('document_groups').insert({
        id,
        name,
        description,
        owner_id: userId,
        visibility,
        members: JSON.stringify([{ user_id: userId, role: 'owner' }]),
      });
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

    const allowedFields = ['name', 'description', 'visibility'];
    const updates = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
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

const addMember = async (groupId, userId, memberUserId, role = 'viewer') => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && group.owner_id !== userId) {
      throw new Error('Only the owner or admin can add members');
    }

    if (role === 'owner') {
      throw new Error('Cannot assign owner role; only the creator can be owner');
    }

    const memberUser = await knex().from('users').where({ id: memberUserId }).first();
    if (!memberUser) throw new Error('User not found');

    const memberIndex = await findMemberIndex(groupId, memberUserId);
    if (memberIndex !== -1) {
      throw new Error('User is already a member of this group');
    }

    await addMemberToGroup(groupId, { user_id: memberUserId, role });

    logger.info(`Member added to group ${groupId}: user ${memberUserId} as ${role}`);

    return { success: true, data: group };
  } catch (error) {
    logger.error('Add member failed:', error.message);
    throw error;
  }
};

const removeMember = async (groupId, userId, memberUserId) => {
  try {
    const group = await knex().from('document_groups').where({ id: groupId }).first();
    if (!group) throw new Error('Document group not found');

    const isOwner = group.owner_id === userId;
    const isSelfRemoval = userId === memberUserId;

    const user = await knex().from('users').where({ id: userId }).first();
    if (!user) throw new Error('User not found');

    if (!user.roles.includes('admin') && !isOwner && !isSelfRemoval) {
      throw new Error('Only the owner, admin, or the user themselves can remove a member');
    }

    if (isOwner && group.owner_id === memberUserId) {
      throw new Error('Cannot remove yourself as owner. Transfer ownership first.');
    }

    const memberIndex = await findMemberIndex(groupId, memberUserId);
    if (memberIndex === -1) {
      throw new Error('User is not a member of this group');
    }

    await removeMemberFromGroup(groupId, memberIndex);

    logger.info(`Member removed from group ${groupId}: user ${memberUserId}`);

    return { success: true, data: group };
  } catch (error) {
    logger.error('Remove member failed:', error.message);
    throw error;
  }
};

const transferOwnership = async (groupId, userId, newOwnerId) => {
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

    const memberIndex = await findMemberIndex(groupId, newOwnerId);
    if (memberIndex === -1) {
      throw new Error('New owner must already be a member of this group');
    }

    let members = typeof group.members === 'string' ? JSON.parse(group.members) : (group.members || []);

    // Set current owner to viewer
    const oldOwnerIndex = members.findIndex(m => m.user_id === userId);
    if (oldOwnerIndex !== -1) {
      members[oldOwnerIndex].role = 'viewer';
    } else {
      members.push({ user_id: userId, role: 'viewer' });
    }

    // Set new owner to owner
    members[memberIndex].role = 'owner';

    await knex().transaction(async (trx) => {
      await trx('document_groups')
        .where({ id: groupId })
        .update({
          owner_id: newOwnerId,
          members: JSON.stringify(members),
          updated_at: new Date(),
        });
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

const getGroupAccessibleDocuments = async (userId) => {
  try {
    const personalDocs = await knex().from('rag_documents')
      .where({ user_id: userId, status: 'indexed' });

    const userGroups = await knex().from('document_groups')
      .whereRaw('JSON_CONTAINS(members, ?)', [JSON.stringify({ user_id: userId })]);

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

const getUserGroups = async (userId) => {
  try {
    const groups = await knex().from('document_groups')
      .whereRaw('owner_id = ? OR JSON_CONTAINS(members, ?)', [userId, JSON.stringify({ user_id: userId })])
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
  addMember,
  removeMember,
  transferOwnership,
  addDocumentToGroup,
  removeDocumentFromGroup,
  getGroupAccessibleDocuments,
  getGroupDocuments,
};
