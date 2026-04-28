const { getDB } = require('../config/db');
const logger = require('../utils/logger');

const knex = () => getDB();

const createPrompt = async (userId, name, content, type = 'custom', variables = [], settings = {}, isPublic = false) => {
  try {
    const id = require('uuid').v4();
    await knex().insert({
      id,
      user_id: userId,
      name,
      content,
      type,
      variables: JSON.stringify(variables),
      settings: JSON.stringify(settings),
      tags: JSON.stringify([]),
      is_public: isPublic,
    }).into('prompts');

    const prompt = await knex().from('prompts').where({ id }).first();

    logger.info(`Prompt created: ${prompt.name} for user ${userId}`);

    return { success: true, data: prompt };
  } catch (error) {
    logger.error('Create prompt failed:', error.message);
    throw error;
  }
};

const getUserPrompts = async (userId) => {
  try {
    const prompts = await knex().from('prompts')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    return { success: true, data: prompts };
  } catch (error) {
    logger.error('Get user prompts failed:', error.message);
    throw error;
  }
};

const getPrompt = async (promptId, userId) => {
  try {
    const prompt = await knex().from('prompts')
      .where({ id: promptId, user_id: userId })
      .first();

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    return { success: true, data: prompt };
  } catch (error) {
    logger.error('Get prompt failed:', error.message);
    throw error;
  }
};

const updatePrompt = async (promptId, userId, updates) => {
  try {
    const parsedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null) {
        parsedUpdates[key] = JSON.stringify(value);
      } else {
        parsedUpdates[key] = value;
      }
    }
    parsedUpdates.updated_at = new Date();

    await knex().from('prompts')
      .where({ id: promptId, user_id: userId })
      .update(parsedUpdates);
    const prompt = await knex().from('prompts').where({ id: promptId, user_id: userId }).first();

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    logger.info(`Prompt updated: ${promptId}`);

    return { success: true, data: prompt };
  } catch (error) {
    logger.error('Update prompt failed:', error.message);
    throw error;
  }
};

const deletePrompt = async (promptId, userId) => {
  try {
    const existing = await knex().from('prompts').where({ id: promptId, user_id: userId }).first();
    if (!existing) {
      throw new Error('Prompt not found');
    }
    await knex().from('prompts').where({ id: promptId, user_id: userId }).del();

    logger.info(`Prompt deleted: ${promptId}`);

    return { success: true };
  } catch (error) {
    logger.error('Delete prompt failed:', error.message);
    throw error;
  }
};

const executePrompt = async (userId, options) => {
  try {
    const { promptId, promptName, inputs, model, temperature, max_tokens, top_p } = options;

    let prompt;
    if (promptId) {
      prompt = await knex().from('prompts').where({ id: promptId, user_id: userId }).first();
    } else if (promptName) {
      prompt = await knex().from('prompts').where({ user_id: userId, name: promptName }).first();
    }

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    let content = prompt.content;
    if (inputs) {
      Object.keys(inputs).forEach(key => {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), inputs[key]);
      });
    }

    const settings = typeof prompt.settings === 'string' ? JSON.parse(prompt.settings) : prompt.settings;

    return {
      success: true,
      data: {
        prompt: prompt.name,
        content,
        model: model || settings?.model,
        temperature: temperature ?? settings?.temperature,
        max_tokens: max_tokens ?? settings?.max_tokens,
        top_p: top_p ?? settings?.top_p,
      },
    };
  } catch (error) {
    logger.error('Execute prompt failed:', error.message);
    throw error;
  }
};

module.exports = {
  createPrompt,
  getUserPrompts,
  getPrompt,
  updatePrompt,
  deletePrompt,
  executePrompt,
};
