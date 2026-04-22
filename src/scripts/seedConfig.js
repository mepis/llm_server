require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/database');
const Config = require('../models/Config');

const getEnvConfig = () => {
  const entries = [
    { key: 'PORT', value: String(config.port), category: 'server' },
    { key: 'NODE_ENV', value: config.env, category: 'server' },
    { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL || '', category: 'server' },
    { key: 'MONGODB_URI', value: config.mongodb.uri, category: 'database' },
    { key: 'JWT_SECRET', value: config.jwt.secret, category: 'auth' },
    { key: 'JWT_EXPIRES_IN', value: config.jwt.expiresin, category: 'auth' },
    { key: 'LLAMA_SERVER_URL', value: config.llama.url, category: 'llama' },
    { key: 'LLAMA_TIMEOUT', value: String(config.llama.timeout), category: 'llama' },
    { key: 'TTS_SERVER_URL', value: config.tts.serverUrl || '', category: 'tts' },
    { key: 'TTS_TIMEOUT', value: String(config.tts.timeout), category: 'tts' },
    { key: 'TTS_DEFAULT_SPEAKER', value: config.tts.speaker, category: 'tts' },
    { key: 'TTS_DEFAULT_LANGUAGE', value: config.tts.language, category: 'tts' },
    { key: 'MATRIX_HOMESERVER', value: config.matrix.homeserver, category: 'matrix' },
    { key: 'MATRIX_USER_ID', value: config.matrix.userId || '', category: 'matrix' },
    { key: 'SESSION_TIMEOUT', value: String(config.sessionTimeout), category: 'session' },
    { key: 'MAX_FILE_SIZE', value: String(config.maxFileSize), category: 'session' },
    { key: 'MAX_TOOL_TURNS', value: String(config.session?.maxToolTurns || 10), category: 'session' },
    { key: 'LOG_LEVEL', value: process.env.LOG_LEVEL || 'info', category: 'logging' },
    { key: 'LOG_FORMAT', value: process.env.LOG_FORMAT || 'combined', category: 'logging' },
  ];

  return entries;
};

const seedConfig = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('Connected to MongoDB');

    const existingCount = await Config.countDocuments();
    if (existingCount > 0) {
      console.log('Config already seeded. Skipping.');
      mongoose.disconnect();
      return;
    }

    const envConfig = getEnvConfig();
    const settings = envConfig.map(entry => new Config(entry));
    await Config.insertMany(settings);

    console.log(`Config seeded: ${settings.length} entries`);
    for (const entry of envConfig) {
      const masked = ['MONGODB_URI', 'JWT_SECRET'].includes(entry.key) ? maskValue(entry.value) : entry.value;
      console.log(`  ${entry.key}=${masked}`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Failed to seed config:', error);
    process.exit(1);
  }
};

const maskValue = (value) => {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.substring(0, 4) + '••••' + value.substring(value.length - 4);
};

seedConfig();
