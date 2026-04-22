require('dotenv').config();

const mongoose = require('mongoose');

// Configuration settings
module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/llm_server',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresin: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  llama: {
    url: process.env.LLAMA_SERVER_URL || 'http://localhost:8082',
    timeout: parseInt(process.env.LLAMA_TIMEOUT) || 30000,
  },

  tts: {
    serverUrl: process.env.TTS_SERVER_URL || null,              // e.g., http://tts-server.local:50052
    timeout: parseInt(process.env.TTS_TIMEOUT) || 60000,        // axios timeout in ms
    speaker: process.env.TTS_DEFAULT_SPEAKER || 'Ryan',         // preset speaker name (Ryan, Aiden, Vivian, etc.)
    language: process.env.TTS_DEFAULT_LANGUAGE || 'Auto',       // default language (en, zh, Auto, etc.)
  },

  matrix: {
    homeserver: process.env.MATRIX_HOMESERVER || 'https://matrix.org',
    accessToken: process.env.MATRIX_ACCESS_TOKEN || null,
    userId: process.env.MATRIX_USER_ID || null
  },
  
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 86400000,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,

  session: {
    maxToolTurns: parseInt(process.env.MAX_TOOL_TURNS) || 10,
  }
};
