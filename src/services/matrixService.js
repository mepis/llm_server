const { getDB } = require('../config/db');
const logger = require('../utils/logger');

class MatrixService {
  constructor() {
    this.knex = () => getDB();
  }

  async handleIncomingMessage(roomId, senderId, content) {
    try {
      let user = await this.getUserByMatrixId(senderId);

      if (!user) {
        user = await this.autoCreateUser(senderId);
      }

      const id = require('uuid').v4();
      const message = {
        id,
        room_id: roomId,
        user_id: user.id,
        content,
        is_incoming: true,
        received_at: new Date(),
      };

      await this.knex().insert(message).into('matrix_messages');

      const fullMessage = { ...message, _id: id };
      return { message: fullMessage, user };
    } catch (error) {
      logger.error('Handle incoming matrix message failed:', error.message);
      throw error;
    }
  }

  async autoCreateUser(matrixId) {
    try {
      const username = matrixId.replace(/[^a-zA-Z0-9]/g, '_');
      const existing = await this.knex().from('users').whereRaw(
        'JSON_EXTRACT(metadata, "$.matrix_id") = ?',
        [matrixId]
      ).first();
      if (existing) return existing;

      const id = require('uuid').v4();
      const user = {
        id,
        username: username.substring(0, 30),
        email: `${username}@matrix.local`,
        password_hash: null,
        roles: JSON.stringify(['user']),
        is_active: true,
        created_at: new Date(),
        last_login: null,
      };

      await this.knex().insert(user).into('users');
      return { ...user, _id: id };
    } catch (error) {
      logger.error('Auto create matrix user failed:', error.message);
      throw error;
    }
  }

  async createRoomChatSession(roomId, userId) {
    try {
      const session = await this.knex().from('chat_sessions')
        .where({ room_id: roomId })
        .orderBy('created_at', 'desc')
        .first();

      if (!session) {
        const id = require('uuid').v4();
        const newSession = {
          id,
          room_id: roomId,
          user_id: userId,
          session_name: `Matrix Chat ${roomId}`,
          created_at: new Date(),
        };
        await this.knex().insert(newSession).into('chat_sessions');
        return newSession;
      }

      return session;
    } catch (error) {
      logger.error('Create room chat session failed:', error.message);
      throw error;
    }
  }

  async sendResponse(roomId, content) {
    try {
      const lastIncoming = await this.knex().from('matrix_messages')
        .where({ room_id: roomId, is_incoming: true })
        .orderBy('received_at', 'desc')
        .first();

      if (!lastIncoming) {
        throw new Error('No incoming message found in room');
      }

      const id = require('uuid').v4();
      const response = {
        id,
        room_id: roomId,
        user_id: lastIncoming.user_id,
        content,
        is_incoming: false,
        received_at: new Date(),
      };

      await this.knex().insert(response).into('matrix_messages');
      return { ...response, _id: id };
    } catch (error) {
      logger.error('Send matrix response failed:', error.message);
      throw error;
    }
  }

  async getUserByMatrixId(matrixId) {
    try {
      const user = await this.knex().from('users')
        .whereRaw('JSON_EXTRACT(metadata, "$.matrix_id") = ?', [matrixId])
        .first();
      return user;
    } catch (error) {
      logger.error('Get user by matrix id failed:', error.message);
      throw error;
    }
  }

  async listRoomMessages(roomId, limit = 50) {
    try {
      const messages = await this.knex().from('matrix_messages')
        .where({ room_id: roomId })
        .orderBy('received_at', 'asc')
        .limit(limit);

      return messages.map(m => ({ ...m, _id: m.id }));
    } catch (error) {
      logger.error('List room messages failed:', error.message);
      throw error;
    }
  }
}

module.exports = MatrixService;
