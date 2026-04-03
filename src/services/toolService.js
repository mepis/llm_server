const { ObjectId } = require('mongodb');
const { Worker } = require('worker_threads');
const pool = require('../config/workerPool');

class ToolService {
  constructor(db) {
    this.tools = db.collection('tools');
  }

  async createTool(userId, name, description, code, parameters = [], isActive = true) {
    const tool = {
      user_id: new ObjectId(userId),
      name,
      description,
      code,
      parameters,
      is_active: isActive,
      created_at: new Date(),
    };
    const result = await this.tools.insertOne(tool);
    return { ...tool, _id: result.insertedId };
  }

  async getToolById(toolId, userId) {
    const tool = await this.tools.findOne({
      _id: new ObjectId(toolId),
      user_id: new ObjectId(userId)
    });
    return tool;
  }

  async listTools(userId, filterActive = null) {
    const query = { user_id: new ObjectId(userId) };
    if (filterActive !== null) {
      query.is_active = filterActive;
    }
    const cursor = this.tools.find(query);
    const tools = await cursor.toArray();
    return tools.map(t => ({
      ...t,
      _id: t._id.toString()
    }));
  }

  async executeTool(toolId, userId, inputParams) {
    const tool = await this.tools.findOne({
      _id: new ObjectId(toolId),
      user_id: new ObjectId(userId)
    });

    if (!tool) {
      throw new Error('Tool not found or access denied');
    }

    if (!tool.is_active) {
      throw new Error('Tool is disabled');
    }

    const execution = await pool.run({
      type: 'execute-tool',
      code: tool.code,
      parameters: tool.parameters,
      input: inputParams
    });

    return execution;
  }

  async updateTool(toolId, userId, updates) {
    const result = await this.tools.findOneAndUpdate(
      {
        _id: new ObjectId(toolId),
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

  async deleteTool(toolId, userId) {
    const result = await this.tools.deleteOne({
      _id: new ObjectId(toolId),
      user_id: new ObjectId(userId)
    });
    return result.deletedCount > 0;
  }
}

module.exports = ToolService;
