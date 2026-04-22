const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const Config = require('../models/Config');
const axios = require('axios');
const logger = require('../utils/logger');

const checkLlamaHealth = async () => {
  try {
    const llamaUrlSetting = await Config.findOne({ key: 'LLAMA_SERVER_URL' });
    if (!llamaUrlSetting || !llamaUrlSetting.value) {
      return { status: 'unconfigured', latency: null };
    }

    const startTime = Date.now();
    const response = await axios.get(`${llamaUrlSetting.value}/health`, {
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    return { status: 'healthy', latency, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const checkTTSHealth = async () => {
  try {
    const ttsUrlSetting = await Config.findOne({ key: 'TTS_SERVER_URL' });
    if (!ttsUrlSetting || !ttsUrlSetting.value) {
      return { status: 'unconfigured', latency: null };
    }

    const startTime = Date.now();
    const response = await axios.get(`${ttsUrlSetting.value}/health`, {
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    return { status: 'healthy', latency, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const checkMatrixHealth = async () => {
  try {
    const homeserverSetting = await Config.findOne({ key: 'MATRIX_HOMESERVER' });
    if (!homeserverSetting || !homeserverSetting.value) {
      return { status: 'unconfigured', latency: null };
    }

    const accessTokenSetting = await Config.findOne({ key: 'MATRIX_ACCESS_TOKEN' });
    if (!accessTokenSetting || !accessTokenSetting.value || accessTokenSetting.value === 'null') {
      return { status: 'unconfigured', latency: null };
    }

    const startTime = Date.now();
    const response = await axios.get(`${homeserverSetting.value}/_matrix/client/v3/sync`, {
      headers: { Authorization: `Bearer ${accessTokenSetting.value}` },
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    return { status: 'healthy', latency, details: response.data };
  } catch (error) {
    return { status: 'unreachable', latency: null, error: error.message };
  }
};

const getHealth = async (req, res) => {
  try {
    const [llama, tts, matrix] = await Promise.all([
      checkLlamaHealth(),
      checkTTSHealth(),
      checkMatrixHealth()
    ]);

    res.json({
      success: true,
      data: {
        llama,
        tts,
        matrix
      }
    });
  } catch (error) {
    logger.error('Failed to get health status:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

router.get('/health', authMiddleware, rbac.requireAdmin, getHealth);

module.exports = router;
