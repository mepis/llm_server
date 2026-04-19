const Prompt = require('../models/Prompt');
const logger = require('../utils/logger');

const createPrompt = async (userId, name, content, type = 'custom', variables = [], settings = {}, isPublic = false) => {
  try {
    const prompt = await Prompt.create({
      user_id: userId,
      name,
      content,
      type,
      variables,
      settings,
      is_public: isPublic
    });
    
    logger.info(`Prompt created: ${prompt.name} for user ${userId}`);
    
    return {
      success: true,
      data: prompt
    };
  } catch (error) {
    logger.error('Create prompt failed:', error.message);
    throw error;
  }
};

const getUserPrompts = async (userId) => {
  try {
    const prompts = await Prompt.find({ user_id: userId })
      .sort({ created_at: -1 });
    
    return {
      success: true,
      data: prompts
    };
  } catch (error) {
    logger.error('Get user prompts failed:', error.message);
    throw error;
  }
};

const getPrompt = async (promptId, userId) => {
  try {
    const prompt = await Prompt.findOne({
      _id: promptId,
      user_id: userId
    });
    
    if (!prompt) {
      throw new Error('Prompt not found');
    }
    
    return {
      success: true,
      data: prompt
    };
  } catch (error) {
    logger.error('Get prompt failed:', error.message);
    throw error;
  }
};

const updatePrompt = async (promptId, userId, updates) => {
  try {
    const prompt = await Prompt.findOneAndUpdate(
      { _id: promptId, user_id: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!prompt) {
      throw new Error('Prompt not found');
    }
    
    logger.info(`Prompt updated: ${promptId}`);
    
    return {
      success: true,
      data: prompt
    };
  } catch (error) {
    logger.error('Update prompt failed:', error.message);
    throw error;
  }
};

const deletePrompt = async (promptId, userId) => {
  try {
    const prompt = await Prompt.findOneAndDelete({
      _id: promptId,
      user_id: userId
    });
    
    if (!prompt) {
      throw new Error('Prompt not found');
    }
    
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
      prompt = await Prompt.findOne({ _id: promptId, user_id: userId });
    } else if (promptName) {
      prompt = await Prompt.findOne({ user_id: userId, name: promptName });
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
    
    return {
      success: true,
      data: {
        prompt: prompt.name,
        content,
        model: model || prompt.settings?.model,
        temperature: temperature ?? prompt.settings?.temperature,
        max_tokens: max_tokens ?? prompt.settings?.max_tokens,
        top_p: top_p ?? prompt.settings?.top_p
      }
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
  executePrompt
};
