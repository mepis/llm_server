require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const knex = () => require('../config/db').getDB();

const getEnvConfig = () => {
  const config = require('../config/database');
  const entries = [
    { key: 'PORT', value: String(config.port), category: 'server' },
    { key: 'NODE_ENV', value: config.env, category: 'server' },
    { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL || '', category: 'server' },
    { key: 'MARIADB_URI', value: `mysql2://${config.db?.host || 'localhost'}:${config.db?.port || 3306}/${config.db?.database || 'llm_server'}`, category: 'database' },
    { key: 'QDRANT_API_KEY', value: process.env.QDRANT_API_KEY || '', category: 'database' },
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

const maskValue = (value) => {
  if (!value) return '';
  if (value.length <= 8) return '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
  return value.substring(0, 4) + '\u2022\u2022\u2022\u2022' + value.substring(value.length - 4);
};

const seedConfig = async () => {
  try {
    await connectDB();
    console.log('Connected to MariaDB');

    const count = await knex().from('configs').count('* as total').first();
    if (parseInt(count.total) > 0) {
      console.log('Config already seeded. Skipping.');
      await disconnectDB();
      return;
    }

    const envConfig = getEnvConfig();
    const rows = envConfig.map(entry => ({ id: require('uuid').v4(), ...entry }));
    await knex().insert(rows).into('configs');

    console.log(`Config seeded: ${rows.length} entries`);
    for (const entry of envConfig) {
      const masked = ['MARIADB_URI', 'JWT_SECRET', 'QDRANT_API_KEY'].includes(entry.key) ? maskValue(entry.value) : entry.value;
      console.log(`  ${entry.key}=${masked}`);
    }

    await disconnectDB();
  } catch (error) {
    console.error('Failed to seed config:', error);
    process.exit(1);
  }
};

seedConfig();
