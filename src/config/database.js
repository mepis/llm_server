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
    ttsSpeakerFile: process.env.TTS_SPEAKER_FILE || null,
  },

  chatterbox: {
    grpcHost: process.env.CHATTERBOX_GRPC_HOST || 'localhost',
    grpcPort: parseInt(process.env.CHATTERBOX_GRPC_PORT) || 50051,
    speakerFile: process.env.CHATTERBOX_SPEAKER_FILE || null,
    temperature: parseFloat(process.env.CHATTERBOX_TEMPERATURE) || 0.8,
    topP: parseFloat(process.env.CHATTERBOX_TOP_P) || 0.95,
    topK: parseInt(process.env.CHATTERBOX_TOP_K) || 1000,
  },

  matrix: {
    homeserver: process.env.MATRIX_HOMESERVER || 'https://matrix.org',
    accessToken: process.env.MATRIX_ACCESS_TOKEN || null,
    userId: process.env.MATRIX_USER_ID || null
  },
  
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 86400000,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
};
