const knex = () => require('../config/db').getDB();
const config = require('../config/database');
const logger = require('../utils/logger');

const getAllSettings = async (req, res) => {
  try {
    const settings = await knex().from('configs').orderBy('category', 'asc').orderBy('key', 'asc');
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Failed to get all settings:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSetting = async (req, res) => {
  try {
    const setting = await knex().from('configs').where({ key: req.params.key }).first();
    if (!setting) return res.status(404).json({ success: false, error: 'Setting not found' });
    res.json({ success: true, data: setting });
  } catch (error) {
    logger.error('Failed to get setting:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) return res.status(400).json({ success: false, error: 'Value is required' });

    let setting = await knex().from('configs').where({ key }).first();

    if (setting) {
      await knex().from('configs').where({ key }).update({ value: String(value), updated_at: new Date() });
      setting.value = String(value);
    } else {
      const count = await knex().from('configs').count('* as total').first();
      if (parseInt(count.total) === 0) {
        return res.status(400).json({ success: false, error: 'Settings not initialized. Run seedConfig first.' });
      }
      await knex().from('configs').insert({ id: require('uuid').v4(), key, value: String(value), category: 'server' });
    }

    logger.info(`Setting updated: ${key}`);
    res.json({ success: true, data: setting || { key, value: String(value) } });
  } catch (error) {
    logger.error('Failed to update setting:', error.message);
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) return res.status(409).json({ success: false, error: 'Setting key already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
};

const resetToEnvDefaults = async (req, res) => {
  try {
    const envConfig = getEnvConfig();
    let updated = 0;
    let created = 0;

    for (const entry of envConfig) {
      const existing = await knex().from('configs').where({ key: entry.key }).first();
      if (existing) {
        if (existing.value !== entry.value) {
          await knex().from('configs').where({ key: entry.key }).update({ value: entry.value });
          updated++;
        }
      } else {
        await knex().from('configs').insert({ id: require('uuid').v4(), ...entry });
        created++;
      }
    }

    logger.info(`Settings reset from env: ${updated} updated, ${created} created`);
    res.json({ success: true, data: { updated, created } });
  } catch (error) {
    logger.error('Failed to reset settings:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEnvConfig = () => {
  const entries = [
    { key: 'PORT', value: String(config.port), category: 'server' },
    { key: 'NODE_ENV', value: config.env, category: 'server' },
    { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL || '', category: 'server' },
    { key: 'MARIADB_URI', value: `mysql2://${config.db?.host || 'localhost'}:${config.db?.port || 3306}/${config.db?.database || 'llm_server'}`, category: 'database' },
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

module.exports = { getAllSettings, getSetting, updateSetting, resetToEnvDefaults };
