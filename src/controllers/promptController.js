const promptService = require('../services/promptService');
const logger = require('../utils/logger');

const createPrompt = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, content, variables, settings } = req.body;
    if (!name || !content) return res.status(400).json({ success: false, error: 'Name and content are required' });
    const result = await promptService.createPrompt(userId, name, content, variables, settings);
    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Create prompt failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const getUserPrompts = async (req, res) => {
  try {
    const result = await promptService.getUserPrompts(req.user.user_id);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get user prompts failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPrompt = async (req, res) => {
  try {
    const result = await promptService.getPrompt(req.params.promptId, req.user.user_id);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get prompt failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const result = await promptService.updatePrompt(req.params.promptId, req.user.user_id, req.body);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Update prompt failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const deletePrompt = async (req, res) => {
  try {
    await promptService.deletePrompt(req.params.promptId, req.user.user_id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete prompt failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

const executePrompt = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { promptId, promptName, inputs, model, temperature, max_tokens, top_p } = req.body;
    if (!promptId && !promptName) return res.status(400).json({ success: false, error: 'Prompt ID or name is required' });
    const result = await promptService.executePrompt(userId, { promptId, promptName, inputs, model, temperature, max_tokens, top_p });
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Execute prompt failed:', error.message);
    res.status(404).json({ success: false, error: error.message });
  }
};

module.exports = { createPrompt, getUserPrompts, getPrompt, updatePrompt, deletePrompt, executePrompt };
