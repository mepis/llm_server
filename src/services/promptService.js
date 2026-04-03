const { ObjectId } = require('mongodb');

class PromptService {
  constructor(db) {
    this.prompts = db.collection('prompts');
  }

  async createPrompt(userId, name, content, type, tags = [], isPublic = false) {
    const prompt = {
      user_id: new ObjectId(userId),
      name,
      content,
      type,
      tags,
      is_public: isPublic,
      created_at: new Date(),
    };
    const result = await this.prompts.insertOne(prompt);
    return { ...prompt, _id: result.insertedId };
  }

  async getPromptById(promptId, userId) {
    const prompt = await this.prompts.findOne({
      _id: new ObjectId(promptId),
      $or: [
        { user_id: new ObjectId(userId) },
        { is_public: true }
      ]
    });
    return prompt;
  }

  async listPrompts(userId, filterType = null) {
    const query = { user_id: new ObjectId(userId) };
    if (filterType) {
      query.type = filterType;
    }
    const cursor = this.prompts.find(query);
    const prompts = await cursor.toArray();
    return prompts.map(p => ({
      ...p,
      _id: p._id.toString()
    }));
  }

  async getPublicPrompts() {
    const cursor = this.prompts.find({ is_public: true });
    const prompts = await cursor.toArray();
    return prompts.map(p => ({
      ...p,
      _id: p._id.toString()
    }));
  }

  async updatePrompt(promptId, userId, updates) {
    const result = await this.prompts.findOneAndUpdate(
      {
        _id: new ObjectId(promptId),
        user_id: new ObjectId(userId)
      },
      {
        $set: {
          ...updates,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  async deletePrompt(promptId, userId) {
    const result = await this.prompts.deleteOne({
      _id: new ObjectId(promptId),
      user_id: new ObjectId(userId)
    });
    return result.deletedCount > 0;
  }
}

module.exports = PromptService;
