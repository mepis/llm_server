const skillService = require('../services/skillService');
const logger = require('../utils/logger');

const listSkills = async (req, res) => {
  try {
    const userRoles = req.user.roles || ['user'];
    const result = await skillService.getAccessibleSkills(userRoles);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('List skills failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSkill = async (req, res) => {
  try {
    const userRoles = req.user.roles || ['user'];
    const name = req.params.name;
    const result = await skillService.getSkillByName(name);
    const skill = result.data;
    const skillRoles = skill.roles || ['user'];
    if (!skillRoles.some((role) => userRoles.includes(role))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get skill failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSkill = async (req, res) => {
  try {
    const result = await skillService.createSkill(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create skill failed:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateSkill = async (req, res) => {
  try {
    const result = await skillService.updateSkill(req.params.name, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update skill failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const result = await skillService.deleteSkill(req.params.name);
    res.json(result);
  } catch (error) {
    logger.error('Delete skill failed:', error.message);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
};
