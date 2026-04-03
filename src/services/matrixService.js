const { ObjectId } = require('mongodb');

class MatrixService {
  constructor(db) {
    this.matrixMessages = db.collection('matrix_messages');
    this.users = db.collection('users');
  }

  async handleIncomingMessage(roomId, senderId, content) {
    let user = await this.users.findOne({ matrix_id: senderId });
    
    if (!user) {
      user = await this.autoCreateUser(senderId);
    }

    const message = {
      room_id: roomId,
      user_id: new ObjectId(user._id),
      content,
      is_incoming: true,
      received_at: new Date(),
    };

    const result = await this.matrixMessages.insertOne(message);
    return { message: { ...message, _id: result.insertedId }, user };
  }

  async autoCreateUser(matrixId) {
    const username = matrixId.replace(/[^a-zA-Z0-9]/g, '_');
    const existing = await this.users.findOne({ matrix_id: matrixId });
    if (existing) return existing;

    const user = {
      username: username.substring(0, 30),
      email: `${username}@matrix.local`,
      matrix_id: matrixId,
      password_hash: null,
      roles: ['user'],
      is_active: true,
      created_at: new Date(),
      last_login: null,
    };

    const result = await this.users.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async createRoomChatSession(roomId, userId) {
    const userObjectId = new ObjectId(userId);
    let session = await this.matrixMessages.findOne(
      { room_id: roomId, user_id: userObjectId },
      { sort: { received_at: -1 } }
    );

    if (!session) {
      const newSession = {
        room_id: roomId,
        user_id: userObjectId,
        session_name: `Matrix Chat ${roomId}`,
        created_at: new Date(),
      };
      await this.matrixMessages.insertOne(newSession);
      return newSession;
    }

    return session;
  }

  async sendResponse(roomId, content) {
    const lastIncoming = await this.matrixMessages.findOne({
      room_id: roomId,
      is_incoming: true
    }, { sort: { received_at: -1 } });

    if (!lastIncoming) {
      throw new Error('No incoming message found in room');
    }

    const response = {
      room_id: roomId,
      user_id: lastIncoming.user_id,
      content,
      is_incoming: false,
      sent_at: new Date(),
    };

    const result = await this.matrixMessages.insertOne(response);
    return { ...response, _id: result.insertedId };
  }

  async getUserByMatrixId(matrixId) {
    return await this.users.findOne({ matrix_id: matrixId });
  }

  async listRoomMessages(roomId, limit = 50) {
    const cursor = this.matrixMessages.find({ room_id: roomId })
      .sort({ received_at: 1 })
      .limit(limit);

    const messages = await cursor.toArray();
    return messages.map(m => ({
      ...m,
      _id: m._id.toString()
    }));
  }
}

module.exports = MatrixService;
