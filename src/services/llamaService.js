const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/database');

let cachedModels = null;
let modelsCacheTime = null;
const CACHE_TTL = 60000;

const getModels = async () => {
  const now = Date.now();
  
  if (cachedModels && modelsCacheTime && (now - modelsCacheTime < CACHE_TTL)) {
    return cachedModels;
  }
  
  try {
    const response = await axios.get(`${config.llama.url}/v1/models`, {
      timeout: config.llama.timeout
    });
    
    cachedModels = response.data;
    modelsCacheTime = now;
    
    return cachedModels;
  } catch (error) {
    logger.error('Failed to get models from Llama.cpp:', error.message);
    throw error;
  }
};

const getChatCompletions = async (messages, options = {}) => {
  try {
    const response = await axios.post(
      `${config.llama.url}/v1/chat/completions`,
      {
        messages,
        ...options
      },
      {
        timeout: config.llama.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error('Failed to get chat completions:', error.message);
    throw error;
  }
};

const getEmbeddings = async (input, model = 'all-MiniLM-L6-v2') => {
  try {
    const response = await axios.post(
      `${config.llama.url}/v1/embeddings`,
      {
        model,
        input: Array.isArray(input) ? input : [input]
      },
      {
        timeout: config.llama.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error('Failed to get embeddings:', error.message);
    throw error;
  }
};

const healthCheck = async () => {
  try {
    const response = await axios.get(`${config.llama.url}/health`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    logger.error('Llama.cpp health check failed:', error.message);
    return null;
  }
};

module.exports = {
  getModels,
  getChatCompletions,
  getEmbeddings,
  healthCheck
};
