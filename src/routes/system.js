const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const knex = () => require('../config/db').getDB();
const axios = require('axios');
const logger = require('../utils/logger');

const getSettingValue = async (key) => {
  const setting = await knex().from('configs').where({ key }).first();
  return setting ? setting.value : null;
};

const checkLlamaHealth = async () => {
  try {
    const llamaUrl = await getSettingValue('LLAMA_SERVER_URL');
    if (!llamaUrl) return { status: 'unconfigured', latency: null };

    const startTime = Date.now();
    const response = await axios.get(`${llamaUrl}/health`, { timeout: 5000 });
    return { status: 'healthy', latency: Date.now() - startTime, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const checkTTSHealth = async () => {
  try {
    const ttsUrl = await getSettingValue('TTS_SERVER_URL');
    if (!ttsUrl) return { status: 'unconfigured', latency: null };

    const startTime = Date.now();
    const response = await axios.get(`${ttsUrl}/health`, { timeout: 5000 });
    return { status: 'healthy', latency: Date.now() - startTime, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const checkMatrixHealth = async () => {
  try {
    const homeserver = await getSettingValue('MATRIX_HOMESERVER');
    if (!homeserver) return { status: 'unconfigured', latency: null };

    const accessToken = await getSettingValue('MATRIX_ACCESS_TOKEN');
    if (!accessToken || accessToken === 'null') return { status: 'unconfigured', latency: null };

    const startTime = Date.now();
    const response = await axios.get(`${homeserver}/_matrix/client/v3/sync`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 5000,
    });
    return { status: 'healthy', latency: Date.now() - startTime, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const getHealth = async (req, res) => {
  try {
    const [llama, tts, matrix] = await Promise.all([checkLlamaHealth(), checkTTSHealth(), checkMatrixHealth()]);
    res.json({ success: true, data: { llama, tts, matrix } });
  } catch (error) {
    logger.error('Failed to get health status:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

router.get('/health', authMiddleware, rbac.requireAdmin, getHealth);

module.exports = router;
